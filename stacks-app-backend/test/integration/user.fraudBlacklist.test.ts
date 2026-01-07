import { User } from '../../src/domain/entities/user';
import { FraudAttempt } from '../../src/domain/entities/fraudAttempt';
import { EntityManager } from 'typeorm';
import { UserService } from '../../src/application/user/userService';
import { UserDomainService } from '../../src/domain/service/userDomainService';
import { GameSessionService } from '../../src/domain/service/gameSessionService';
import { StreakService } from '../../src/application/streaks/streakService';
import { StreaksDomainService } from '../../src/domain/service/streaksDomainService';
import { RedisCacheAdapter } from '../../src/infra/redis/cacheAdapter';
import { MAX_FRAUD_ATTEMPTS } from '../../src/shared/constants';
import {
  GameSession,
  DailyStreakChallenge,
  FraudReason,
} from '../../src/shared/types';
import { ADMIN_PRIVATE_KEY } from '../../src/shared/constants';
import {
  cleanTestDatabase,
  closeTestDataSource,
  createTestDataSource,
  getTestDataSource,
} from './testDataSource';
import { ITransactionClient } from '../../src/application/ports/ITransactionClient';

describe('User Fraud Limits and Blacklisting Integration Tests', () => {
  let userService: UserService;
  let entityManager: EntityManager;
  let dataSource: ReturnType<typeof getTestDataSource>;
  let gameSessionService: GameSessionService;
  let cacheAdapter: RedisCacheAdapter;
  let streakService: StreakService;
  let transactionClientMock: jest.Mocked<ITransactionClient>;
  beforeAll(async () => {
    await createTestDataSource();
    dataSource = getTestDataSource();
    entityManager = dataSource.createEntityManager();

    const userDomainService = new UserDomainService();
    gameSessionService = new GameSessionService();
    cacheAdapter = new RedisCacheAdapter();
    streakService = new StreakService(
      new StreaksDomainService(),
      cacheAdapter,
      entityManager,
    );
    transactionClientMock = {
      createTournamentUnsignedTransaction: jest.fn(),
      broadcastSponsoredTransaction: jest.fn(),
      broadcastTransaction: jest.fn(),
      getTournamentId: jest.fn().mockResolvedValue(1),
      getTransactionStatus: jest.fn(),
      distributeRewards: jest.fn(),
      headToNextTournament: jest.fn(),
    } as unknown as jest.Mocked<ITransactionClient>;

    userService = new UserService(
      userDomainService,
      streakService,
      gameSessionService,
      transactionClientMock,
      entityManager,
    );
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  /**
   * Helper to set up daily streak challenge
   */
  const setupDailyStreakChallenge = async (
    challenge: DailyStreakChallenge,
  ): Promise<void> => {
    const challengeData = {
      description: challenge.description,
    };
    await cacheAdapter.set(
      'dailyStreakChallenge',
      challengeData as unknown as DailyStreakChallenge,
    );

    // Patch RedisCacheAdapter to reconstruct validator
    const originalGet = RedisCacheAdapter.prototype.get;

    RedisCacheAdapter.prototype.get = async function <T>(
      key: string,
    ): Promise<T> {
      const result = await originalGet.call(this, key);
      if (key === 'dailyStreakChallenge' && result) {
        const challengeResult = result as unknown as DailyStreakChallenge;
        challengeResult.validator = challenge.validator;
      }
      return result as T;
    };
  };

  /**
   * Helper to create a valid game session that would normally earn points
   */
  const createValidGameSession = async (): Promise<GameSession> => {
    const { seed, signature } =
      await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
    return {
      seed,
      signature,
      moves: [
        { startTime: 0, duration: 100 },
        { startTime: 200, duration: 150 },
        { startTime: 400, duration: 120 },
      ],
      usedItems: [],
    };
  };

  /**
   * Helper to create a fraudulent game session
   */
  const createFraudulentGameSession = async (): Promise<GameSession> => {
    const { seed, signature } =
      await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
    // Empty moves array triggers INVALID_DATA fraud
    return {
      seed,
      signature,
      moves: [],
      usedItems: [],
    };
  };

  it('should NOT blacklist user with exactly 10 fraud attempts', async () => {
    // Create user
    const user = new User();
    user.googleId = 'user-fraud-test-12345678901234567890';
    user.nickName = 'FraudUser';
    user.referralCode = 'FRAUD001';
    user.points = 0;
    user.fraudAttempts = [];
    await entityManager.save(user);

    // Add exactly 10 fraud attempts
    for (let i = 0; i < MAX_FRAUD_ATTEMPTS; i++) {
      const fraudAttempt = new FraudAttempt();
      fraudAttempt.fraudReason = FraudReason.TOO_FAST_BRIDGE;
      fraudAttempt.fraudData = {
        seed: 'test-seed',
        signature: 'test-sig',
        moves: [],
        usedItems: [],
      };
      fraudAttempt.user = user;
      user.addFraudAttempt(fraudAttempt);
    }

    await entityManager.save(user);

    // Verify user is NOT blacklisted
    const userAfter = await entityManager.findOne(User, {
      where: { id: user.id },
      relations: ['fraudAttempts'],
    });

    expect(userAfter?.isBlackListed).toBe(false);
    expect(userAfter?.fraudAttempts.length).toBe(MAX_FRAUD_ATTEMPTS);
  });

  it('should blacklist user when they exceed 10 fraud attempts (11th attempt)', async () => {
    // Create user
    const user = new User();
    user.googleId = 'user-fraud-test-12345678901234567890';
    user.nickName = 'FraudUser';
    user.referralCode = 'FRAUD002';
    user.points = 0;
    user.fraudAttempts = [];
    await entityManager.save(user);

    // Add exactly 10 fraud attempts
    for (let i = 0; i < MAX_FRAUD_ATTEMPTS; i++) {
      const fraudAttempt = new FraudAttempt();
      fraudAttempt.fraudReason = FraudReason.TOO_FAST_BRIDGE;
      fraudAttempt.fraudData = {
        seed: 'test-seed',
        signature: 'test-sig',
        moves: [],
        usedItems: [],
      };
      fraudAttempt.user = user;
      user.addFraudAttempt(fraudAttempt);
    }
    await entityManager.save(user);

    // Verify user is NOT blacklisted yet
    const userBefore = await entityManager.findOne(User, {
      where: { id: user.id },
      relations: ['fraudAttempts'],
    });
    expect(userBefore?.isBlackListed).toBe(false);

    // Add 11th fraud attempt through validateSessionAndAwardPoints
    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: jest.fn().mockReturnValue(false),
    };
    await setupDailyStreakChallenge(dailyChallenge);

    const fraudulentSession = await createFraudulentGameSession();

    // This should add the 11th fraud attempt and blacklist the user
    await userService.validateSessionAndAwardPoints(user.id, fraudulentSession);

    // Verify user is now blacklisted
    const userAfter = await entityManager.findOne(User, {
      where: { id: user.id },
      relations: ['fraudAttempts'],
    });

    expect(userAfter?.isBlackListed).toBe(true);
    expect(userAfter?.fraudAttempts.length).toBe(MAX_FRAUD_ATTEMPTS + 1);
  });

  it('should return score and points 0 for blacklisted user even with valid session', async () => {
    const user = new User();
    user.googleId = 'user-fraud-test-12345678901234567890';
    user.nickName = 'FraudUser';
    user.referralCode = 'FRAUD003';
    user.points = 100; // User has some points
    user.fraudAttempts = [];

    for (let i = 0; i < MAX_FRAUD_ATTEMPTS + 1; i++) {
      const fraudAttempt = new FraudAttempt();
      fraudAttempt.fraudReason = FraudReason.TOO_FAST_BRIDGE;
      fraudAttempt.fraudData = {
        seed: 'test-seed',
        signature: 'test-signature',
        moves: [],
        usedItems: [],
      };
      user.addFraudAttempt(fraudAttempt);
    }

    await entityManager.save(user);

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: jest.fn().mockReturnValue(true), // Valid challenge completion
    };
    await setupDailyStreakChallenge(dailyChallenge);

    // Create a valid game session that would normally earn points
    const validSession = await createValidGameSession();

    // Blacklisted user should get 0 score and 0 points even with valid session
    const result = await userService.validateSessionAndAwardPoints(
      user.id,
      validSession,
    );

    expect(result.sessionScore).toBe(0);
    expect(result.pointsEarned).toBe(0);
    expect(result.totalPoints).toBe(user.points); // Total points remain unchanged
    expect(result.isFraud).toBe(false);
    expect(result.fraudReason).toBe(FraudReason.USER_BLACK_LISTED);

    // Verify user points did not increase
    const userAfter = await entityManager.findOne(User, {
      where: { id: user.id },
    });
    expect(userAfter?.points).toBe(100); // Points should remain the same
  });

  it('should return USER_BLACK_LISTED when blacklisted user validates session', async () => {
    // Create user with 11 fraud attempts to blacklist them
    const user = new User();
    user.googleId = 'user-fraud-test-12345678901234567890';
    user.nickName = 'FraudUser';
    user.referralCode = 'FRAUD004';
    user.points = 0;
    user.fraudAttempts = [];

    // Create 11 fraud attempts to blacklist the user
    for (let i = 0; i < MAX_FRAUD_ATTEMPTS + 1; i++) {
      const fraudAttempt = new FraudAttempt();
      fraudAttempt.fraudReason = FraudReason.TOO_FAST_BRIDGE;
      fraudAttempt.fraudData = {
        seed: 'test-seed',
        signature: 'test-signature',
        moves: [],
        usedItems: [],
      };
      user.addFraudAttempt(fraudAttempt);
    }

    await entityManager.save(user);

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: jest.fn().mockReturnValue(false),
    };
    await setupDailyStreakChallenge(dailyChallenge);

    const fraudulentSession = await createFraudulentGameSession();

    // Blacklisted user should get USER_BLACK_LISTED response
    const result = await userService.validateSessionAndAwardPoints(
      user.id,
      fraudulentSession,
    );

    expect(result.isFraud).toBe(false);
    expect(result.fraudReason).toBe(FraudReason.USER_BLACK_LISTED);
    expect(result.pointsEarned).toBe(0);
    expect(result.sessionScore).toBe(0);
    expect(result.totalPoints).toBe(user.points);
  });

  it('should save fraud attempts to database when user commits fraud', async () => {
    // Create user
    const user = new User();
    user.googleId = 'user-fraud-test-12345678901234567890';
    user.nickName = 'FraudUser';
    user.referralCode = 'FRAUD005';
    user.points = 0;
    user.fraudAttempts = [];
    await entityManager.save(user);

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: jest.fn().mockReturnValue(false),
    };
    await setupDailyStreakChallenge(dailyChallenge);

    const fraudulentSession = await createFraudulentGameSession();

    // Validate fraudulent session
    await userService.validateSessionAndAwardPoints(user.id, fraudulentSession);

    // Verify fraud attempt was saved to database
    const userAfter = await entityManager.findOne(User, {
      where: { id: user.id },
      relations: ['fraudAttempts'],
    });

    expect(userAfter?.fraudAttempts.length).toBe(1);
    expect(userAfter?.fraudAttempts[0].fraudReason).toBe(
      FraudReason.INVALID_DATA,
    );
    expect(userAfter?.fraudAttempts[0].fraudData).toEqual(fraudulentSession);
  });
});
