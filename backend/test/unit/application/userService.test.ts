import { EntityManager, Repository } from 'typeorm';
import { UserService } from '../../../src/application/user/userService';
import { UserDomainService } from '../../../src/domain/service/userDomainService';
import { User } from '../../../src/domain/entities/user';
import {
  NicknameNotProvidedError,
  UserNotFoundError,
} from '../../../src/application/errors/userErrors';
import { DailyStreakChallengeNotFoundError } from '../../../src/application/errors/streakErrors';
import { GameSessionService } from '../../../src/domain/service/gameSessionService';
import { StreakService } from '../../../src/application/streaks/streakService';
// import { ICachePort } from '../../../src/application/ports/ICachePort';
import {
  GameSession,
  DailyStreakChallenge,
  FraudReason,
} from '../../../src/shared/types';
import {
  ADMIN_PRIVATE_KEY,
  MAX_FRAUD_ATTEMPTS,
} from '../../../src/shared/constants';
import { FraudAttempt } from '../../../src/domain/entities/fraudAttempt';
import { TransactionClientPort } from '../../../src/application/ports/transactionClient';

describe('User Service unit test', () => {
  let userService: UserService;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockUserRepository: jest.Mocked<Repository<User>>;
  let mockUserDomainService: jest.Mocked<UserDomainService>;
  let mockStreakService: jest.Mocked<StreakService>;
  let mockGameSessionService: jest.Mocked<GameSessionService>;
  let mockTransactionClient: jest.Mocked<TransactionClientPort>;
  // let mockCacheAdapter: jest.Mocked<ICachePort>;
  beforeEach(() => {
    // Mock TypeORM Repository
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    // Mock EntityManager
    mockEntityManager = {
      getRepository: jest.fn().mockReturnValue(mockUserRepository),
      save: jest.fn(),
      transaction: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    // Mock UserDomainService
    mockUserDomainService = {
      createUser: jest.fn(),
      addReferrerBonus: jest.fn(),
      increaseUserPoints: jest.fn(),
    } as unknown as jest.Mocked<UserDomainService>;

    // Mock StreakService
    mockStreakService = {
      getDailyStreak: jest.fn(),
      setDailyStreak: jest.fn(),
      resetUsersStreak: jest.fn(),
    } as unknown as jest.Mocked<StreakService>;

    // Mock GameSessionService
    mockGameSessionService = {
      validateSession: jest.fn(),
    } as unknown as jest.Mocked<GameSessionService>;

    // Mock CacheAdapter
    // mockCacheAdapter = {
    //   get: jest.fn(),
    //   set: jest.fn(),
    //   delete: jest.fn(),
    // } as unknown as jest.Mocked<ICachePort>;

    // Mock StreakService
    mockStreakService = {
      getDailyStreak: jest.fn().mockResolvedValue({
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      } as unknown as DailyStreakChallenge),
    } as unknown as jest.Mocked<StreakService>;

    mockTransactionClient = {
      getTournamentId: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<TransactionClientPort>;
    userService = new UserService(
      mockUserDomainService,
      mockStreakService,
      mockGameSessionService,
      mockTransactionClient,
      mockEntityManager,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loginOrRegister', () => {
    const googleId = 'test-google-id';
    const nickName = 'test-nickname';
    const referralCode = 'REF12345';

    it('should return existing user if found by googleId', async () => {
      const existingUser = new User();
      existingUser.googleId = googleId;
      existingUser.nickName = nickName;

      mockUserRepository.findOne.mockResolvedValueOnce(existingUser);

      const result = await userService.loginOrRegister(googleId, nickName);

      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(User);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { googleId },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserDomainService.createUser).not.toHaveBeenCalled();
      expect(mockEntityManager.save).not.toHaveBeenCalled();
      expect(mockEntityManager.transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ user: existingUser, isNewUser: false });
    });

    it('should throw error when nickname is not provided', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        userService.loginOrRegister(googleId, undefined),
      ).rejects.toThrow(NicknameNotProvidedError);

      expect(mockUserDomainService.createUser).not.toHaveBeenCalled();
      expect(mockEntityManager.save).not.toHaveBeenCalled();
    });

    it('should create and save new user when user does not exist', async () => {
      const newUser = new User();
      newUser.googleId = googleId;
      newUser.nickName = nickName;
      newUser.referralCode = 'NEWREF123';

      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockUserDomainService.createUser.mockReturnValue(newUser);
      mockEntityManager.save.mockResolvedValueOnce(newUser);

      const result = await userService.loginOrRegister(googleId, nickName);

      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(User);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { googleId },
      });
      expect(mockUserDomainService.createUser).toHaveBeenCalledWith(
        googleId,
        nickName,
        undefined,
        undefined,
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(newUser);
      expect(mockEntityManager.transaction).not.toHaveBeenCalled();
      expect(result).toEqual({ user: newUser, isNewUser: true });
    });

    it('should create user with referrer and apply bonus in transaction when referral code is valid', async () => {
      const referrer = new User();
      referrer.googleId = 'referrer-id';
      referrer.nickName = 'referrer-name';
      referrer.referralCode = referralCode;
      referrer.points = 50;

      const newUser = new User();
      newUser.googleId = googleId;
      newUser.nickName = nickName;
      newUser.referrer = referrer;
      newUser.referralCode = 'NEWREF123';

      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(undefined),
      };

      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // First call: check for existing user
        .mockResolvedValueOnce(referrer); // Second call: find referrer by referral code
      mockUserDomainService.createUser.mockReturnValue(newUser);
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback(
            mockTransactionManager as unknown as EntityManager,
          );
        },
      );

      const result = await userService.loginOrRegister(
        googleId,
        nickName,
        'photo-uri',
        referralCode,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { googleId },
      });
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { referralCode },
      });
      expect(mockUserDomainService.createUser).toHaveBeenCalledWith(
        googleId,
        nickName,
        'photo-uri',
        referrer,
      );
      expect(mockEntityManager.transaction).toHaveBeenCalledTimes(1);
      expect(mockUserDomainService.addReferrerBonus).toHaveBeenCalledWith(
        referrer,
      );
      expect(mockTransactionManager.save).toHaveBeenCalledWith(newUser);
      expect(mockTransactionManager.save).toHaveBeenCalledWith(referrer);
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.save).not.toHaveBeenCalled();
      expect(result).toEqual({ user: newUser, isNewUser: true });
    });

    it('should create user without referrer when referral code is invalid', async () => {
      const newUser = new User();
      newUser.googleId = googleId;
      newUser.nickName = nickName;
      newUser.referralCode = 'NEWREF123';

      mockUserRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockUserDomainService.createUser.mockReturnValue(newUser);
      mockEntityManager.save.mockResolvedValueOnce(newUser);

      const result = await userService.loginOrRegister(
        googleId,
        nickName,
        'photo-uri',
        referralCode,
      );

      expect(mockUserRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { referralCode },
      });
      expect(mockUserDomainService.createUser).toHaveBeenCalledWith(
        googleId,
        nickName,
        'photo-uri',
        undefined,
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(newUser);
      expect(mockEntityManager.transaction).not.toHaveBeenCalled();
      expect(mockUserDomainService.addReferrerBonus).not.toHaveBeenCalled();
      expect(result).toEqual({ user: newUser, isNewUser: true });
    });
  });

  describe('validateSessionAndAwardPoints', () => {
    const userId = 1;
    const mockGameSession: GameSession = {
      seed: 'test-seed',
      signature: 'test-signature',
      moves: [
        { startTime: 0, duration: 100 },
        { startTime: 200, duration: 150 },
      ],
      usedItems: [],
    };
    let testUser: User;

    beforeEach(() => {
      testUser = new User();
      testUser.id = userId;
      testUser.googleId = 'test-google-id';
      testUser.nickName = 'test-nickname';
      testUser.points = 100;
      testUser.streak = 5;
      testUser.submissions = [];
      testUser.items = [];
      testUser.referees = [];
      testUser.fraudAttempts = [];
      testUser.isBlackListed = false;
    });

    it('should throw UserNotFoundError when user does not exist', async () => {
      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValue(null),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      await expect(
        userService.validateSessionAndAwardPoints(userId, mockGameSession),
      ).rejects.toThrow(UserNotFoundError);

      expect(mockEntityManager.transaction).toHaveBeenCalledTimes(1);
    });

    it('should return USER_BLACK_LISTED when user is blacklisted', async () => {
      // Create 11 fraud attempts to blacklist the user
      for (let i = 0; i < MAX_FRAUD_ATTEMPTS + 1; i++) {
        const fraudAttempt = new FraudAttempt();
        fraudAttempt.fraudReason = FraudReason.TOO_FAST_BRIDGE;
        fraudAttempt.fraudData = mockGameSession;
        testUser.addFraudAttempt(fraudAttempt);
      }

      const mockTransactionManager = {
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(result.fraudReason).toBe(FraudReason.USER_BLACK_LISTED);
      expect(result.sessionScore).toBe(0);
      expect(result.pointsEarned).toBe(0);
      expect(result.totalPoints).toBe(testUser.points);
      expect(result.isFraud).toBe(false);
      expect(mockGameSessionService.validateSession).not.toHaveBeenCalled();
      expect(mockStreakService.getDailyStreak).not.toHaveBeenCalled();
    });

    it('should validate session, award points, and return correct result when streak challenge is not completed', async () => {
      const sessionScore = 100;
      const pointsEarned = 15;
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: sessionScore,
        streakChallengeCompleted: false,
        blocksPassed: 10,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      });
      mockUserDomainService.increaseUserPoints.mockReturnValue(pointsEarned);
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(mockEntityManager.transaction).toHaveBeenCalledTimes(1);
      expect(mockStreakService.getDailyStreak).toHaveBeenCalledTimes(1);
      expect(mockGameSessionService.validateSession).toHaveBeenCalledWith(
        testUser,
        mockGameSession,
        dailyChallenge,
        ADMIN_PRIVATE_KEY,
      );
      expect(mockUserDomainService.increaseUserPoints).toHaveBeenCalledWith(
        testUser,
        sessionScore,
      );
      expect(testUser.streak).toBe(5); // Streak should not increase
      expect(mockTransactionManager.save).toHaveBeenCalledWith(testUser);
      expect(result).toEqual({
        sessionScore,
        pointsEarned,
        totalPoints: testUser.points,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      });
    });

    it('should increase streak when streak challenge is completed', async () => {
      const sessionScore = 200;
      const pointsEarned = 30;
      const initialStreak = 3;
      testUser.streak = initialStreak;
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(true),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      const mockTransactionManagerWithFindOne = {
        ...mockTransactionManager,
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: sessionScore,
        streakChallengeCompleted: true,
        blocksPassed: 15,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      });
      mockUserDomainService.increaseUserPoints.mockReturnValue(pointsEarned);
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManagerWithFindOne);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(mockStreakService.getDailyStreak).toHaveBeenCalledTimes(1);
      expect(mockGameSessionService.validateSession).toHaveBeenCalledWith(
        testUser,
        mockGameSession,
        dailyChallenge,
        ADMIN_PRIVATE_KEY,
      );
      expect(testUser.streak).toBe(initialStreak + 1); // Streak should increase
      expect(mockTransactionManagerWithFindOne.save).toHaveBeenCalledWith(
        testUser,
      );
      expect(result).toEqual({
        sessionScore,
        pointsEarned,
        totalPoints: testUser.points,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      });
    });

    it('should execute all operations within a transaction', async () => {
      const sessionScore = 50;
      const pointsEarned = 8;
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;
      let transactionCallback:
        | ((manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
          }>)
        | null = null;

      const mockTransactionManagerWithFindOne = {
        ...mockTransactionManager,
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: sessionScore,
        streakChallengeCompleted: false,
        blocksPassed: 8,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      });
      mockUserDomainService.increaseUserPoints.mockReturnValue(pointsEarned);
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          transactionCallback = callback;
          return await callback(mockTransactionManagerWithFindOne);
        },
      );

      await userService.validateSessionAndAwardPoints(userId, mockGameSession);

      expect(mockEntityManager.transaction).toHaveBeenCalledTimes(1);
      expect(transactionCallback).not.toBeNull();
      // Verify that all operations happen within the transaction
      expect(mockStreakService.getDailyStreak).toHaveBeenCalled();
      expect(mockGameSessionService.validateSession).toHaveBeenCalled();
      expect(mockUserDomainService.increaseUserPoints).toHaveBeenCalled();
      expect(mockTransactionManagerWithFindOne.save).toHaveBeenCalled();
    });

    it('should return correct totalPoints after points are awarded', async () => {
      const initialPoints = 200;
      const sessionScore = 150;
      const pointsEarned = 22;
      testUser.points = initialPoints;
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      const mockTransactionManagerWithFindOne = {
        ...mockTransactionManager,
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: sessionScore,
        streakChallengeCompleted: false,
        blocksPassed: 12,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      });
      mockUserDomainService.increaseUserPoints.mockReturnValue(pointsEarned);
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManagerWithFindOne);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(result.totalPoints).toBe(initialPoints);
      expect(mockStreakService.getDailyStreak).toHaveBeenCalled();
      expect(mockUserDomainService.increaseUserPoints).toHaveBeenCalledWith(
        testUser,
        sessionScore,
      );
    });

    it('should handle zero session score correctly', async () => {
      const sessionScore = 0;
      const pointsEarned = 0;
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      const mockTransactionManagerWithFindOne = {
        ...mockTransactionManager,
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: sessionScore,
        streakChallengeCompleted: false,
        blocksPassed: 0,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      });
      mockUserDomainService.increaseUserPoints.mockReturnValue(pointsEarned);
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManagerWithFindOne);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(result.sessionScore).toBe(0);
      expect(result.pointsEarned).toBe(0);
      expect(mockStreakService.getDailyStreak).toHaveBeenCalled();
      expect(mockUserDomainService.increaseUserPoints).toHaveBeenCalledWith(
        testUser,
        0,
      );
    });

    it('should throw DailyStreakChallengeNotFoundError when challenge is not found in cache', async () => {
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      // Override the default mock to reject
      mockStreakService.getDailyStreak.mockReset();
      mockStreakService.getDailyStreak.mockRejectedValueOnce(
        new DailyStreakChallengeNotFoundError(),
      );

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      await expect(
        userService.validateSessionAndAwardPoints(userId, mockGameSession),
      ).rejects.toThrow(DailyStreakChallengeNotFoundError);

      expect(mockStreakService.getDailyStreak).toHaveBeenCalled();
      expect(mockGameSessionService.validateSession).not.toHaveBeenCalled();
    });

    it('should throw DailyStreakChallengeNotFoundError when challenge is undefined in cache', async () => {
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      // Override the default mock to reject
      mockStreakService.getDailyStreak.mockReset();
      mockStreakService.getDailyStreak.mockRejectedValueOnce(
        new DailyStreakChallengeNotFoundError(),
      );

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      await expect(
        userService.validateSessionAndAwardPoints(userId, mockGameSession),
      ).rejects.toThrow(DailyStreakChallengeNotFoundError);

      expect(mockStreakService.getDailyStreak).toHaveBeenCalled();
      expect(mockGameSessionService.validateSession).not.toHaveBeenCalled();
    });

    it('should use the correct challenge from cache', async () => {
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(true),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      const mockTransactionManagerWithFindOne = {
        ...mockTransactionManager,
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: 100,
        streakChallengeCompleted: true,
        blocksPassed: 10,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      });
      mockUserDomainService.increaseUserPoints.mockReturnValue(15);
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManagerWithFindOne);
        },
      );

      await userService.validateSessionAndAwardPoints(userId, mockGameSession);

      expect(mockStreakService.getDailyStreak).toHaveBeenCalledTimes(1);
      expect(mockGameSessionService.validateSession).toHaveBeenCalledWith(
        testUser,
        mockGameSession,
        dailyChallenge,
        ADMIN_PRIVATE_KEY,
      );
    });

    it('should create fraud attempt when fraud is detected', async () => {
      const sessionScore = 100;
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: sessionScore,
        streakChallengeCompleted: false,
        blocksPassed: 10,
        isFraud: true,
        fraudReason: FraudReason.TOO_FAST_BRIDGE,
      });
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(result.isFraud).toBe(true);
      expect(result.fraudReason).toBe(FraudReason.TOO_FAST_BRIDGE);
      expect(result.pointsEarned).toBe(0);
      expect(testUser.fraudAttempts.length).toBe(1);
      expect(testUser.fraudAttempts[0].fraudReason).toBe(
        FraudReason.TOO_FAST_BRIDGE,
      );
      expect(testUser.fraudAttempts[0].fraudData).toEqual(mockGameSession);
      expect(mockUserDomainService.increaseUserPoints).not.toHaveBeenCalled();
      expect(mockTransactionManager.save).toHaveBeenCalledWith(testUser);
    });

    it('should create fraud attempt for INVALID_DATA', async () => {
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: 0,
        streakChallengeCompleted: false,
        blocksPassed: 0,
        isFraud: false,
        fraudReason: FraudReason.INVALID_DATA,
      });
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(result.fraudReason).toBe(FraudReason.INVALID_DATA);
      expect(result.pointsEarned).toBe(0);
      expect(testUser.fraudAttempts.length).toBe(1);
      expect(testUser.fraudAttempts[0].fraudReason).toBe(
        FraudReason.INVALID_DATA,
      );
      expect(mockUserDomainService.increaseUserPoints).not.toHaveBeenCalled();
    });

    it('should create fraud attempt for INVALID_ITEM', async () => {
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: 0,
        streakChallengeCompleted: false,
        blocksPassed: 0,
        isFraud: false,
        fraudReason: FraudReason.INVALID_ITEM,
      });
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(result.fraudReason).toBe(FraudReason.INVALID_ITEM);
      expect(result.pointsEarned).toBe(0);
      expect(testUser.fraudAttempts.length).toBe(1);
      expect(testUser.fraudAttempts[0].fraudReason).toBe(
        FraudReason.INVALID_ITEM,
      );
      expect(mockUserDomainService.increaseUserPoints).not.toHaveBeenCalled();
    });

    it('should blacklist user after MAX_FRAUD_ATTEMPTS fraud attempts', async () => {
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      // Create MAX_FRAUD_ATTEMPTS existing fraud attempts
      for (let i = 0; i < MAX_FRAUD_ATTEMPTS; i++) {
        const fraudAttempt = new FraudAttempt();
        fraudAttempt.fraudReason = FraudReason.TOO_FAST_BRIDGE;
        fraudAttempt.fraudData = mockGameSession;
        testUser.fraudAttempts.push(fraudAttempt);
      }

      expect(testUser.isBlackListed).toBe(false);
      expect(testUser.fraudAttempts.length).toBe(MAX_FRAUD_ATTEMPTS);

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: 0,
        streakChallengeCompleted: false,
        blocksPassed: 0,
        isFraud: true,
        fraudReason: FraudReason.PERFECT_RATE_TOO_HIGH,
      });
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      // After adding one more fraud attempt, user should be blacklisted
      expect(testUser.fraudAttempts.length).toBe(MAX_FRAUD_ATTEMPTS + 1);
      expect(testUser.isBlackListed).toBe(true);
      expect(result.isFraud).toBe(true);
      expect(result.pointsEarned).toBe(0);
      expect(mockTransactionManager.save).toHaveBeenCalledWith(testUser);
    });

    it('should not award points when fraud is detected', async () => {
      const sessionScore = 200;
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(true),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: sessionScore,
        streakChallengeCompleted: true,
        blocksPassed: 15,
        isFraud: true,
        fraudReason: FraudReason.DURATION_VARIANCE_TOO_LOW,
      });
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(result.pointsEarned).toBe(0);
      expect(result.isFraud).toBe(true);
      expect(testUser.streak).toBe(5); // Streak should not increase
      expect(mockUserDomainService.increaseUserPoints).not.toHaveBeenCalled();
      expect(testUser.fraudAttempts.length).toBe(1);
    });

    it('should not award points for INVALID_DATA even if score is non-zero', async () => {
      const sessionScore = 100;
      const dailyChallenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn().mockReturnValue(false),
      };
      const mockTransactionManager = {
        save: jest.fn().mockResolvedValue(testUser),
        findOne: jest.fn().mockResolvedValue(testUser),
      } as unknown as EntityManager;

      mockStreakService.getDailyStreak.mockResolvedValueOnce(dailyChallenge);
      mockGameSessionService.validateSession.mockReturnValue({
        score: sessionScore,
        streakChallengeCompleted: false,
        blocksPassed: 0,
        isFraud: false,
        fraudReason: FraudReason.INVALID_DATA,
      });
      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (
          callback: (manager: EntityManager) => Promise<{
            sessionScore: number;
            pointsEarned: number;
            totalPoints: number;
            isFraud: boolean;
            fraudReason: FraudReason;
          }>,
        ) => {
          return await callback(mockTransactionManager);
        },
      );

      const result = await userService.validateSessionAndAwardPoints(
        userId,
        mockGameSession,
      );

      expect(result.pointsEarned).toBe(0);
      expect(result.fraudReason).toBe(FraudReason.INVALID_DATA);
      expect(mockUserDomainService.increaseUserPoints).not.toHaveBeenCalled();
      expect(testUser.fraudAttempts.length).toBe(1);
    });
  });
});
