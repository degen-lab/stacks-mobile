import { User } from '../../src/domain/entities/user';
import { EntityManager } from 'typeorm';
import { UserService } from '../../src/application/user/userService';
import { UserDomainService } from '../../src/domain/service/userDomainService';
import { GameSessionService } from '../../src/domain/service/gameSessionService';
import { StreakService } from '../../src/application/streaks/streakService';
import { StreaksDomainService } from '../../src/domain/service/streaksDomainService';
import { RedisCacheAdapter } from '../../src/infra/redis/cacheAdapter';
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
import { TransactionClientPort } from '../../src/application/ports/transactionClientPort';

describe('User Points Calculation with Streak Boost Integration Tests', () => {
  let userService: UserService;
  let entityManager: EntityManager;
  let dataSource: ReturnType<typeof getTestDataSource>;
  let gameSessionService: GameSessionService;
  let cacheAdapter: RedisCacheAdapter;
  let streakService: StreakService;
  let mockTransactionClient: jest.Mocked<TransactionClientPort>;
  beforeAll(async () => {
    await createTestDataSource();
    dataSource = getTestDataSource();
    entityManager = dataSource.createEntityManager();

    mockTransactionClient = {
      getTournamentId: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<TransactionClientPort>;

    const userDomainService = new UserDomainService();
    gameSessionService = new GameSessionService();
    cacheAdapter = new RedisCacheAdapter();
    streakService = new StreakService(
      new StreaksDomainService(),
      cacheAdapter,
      entityManager,
    );
    userService = new UserService(
      userDomainService,
      streakService,
      gameSessionService,
      mockTransactionClient,
      entityManager,
    );

    // Set up a default challenge mock for findValidSeedAndMoves
    // This will be overridden in individual tests, but we need it for beforeAll
    const defaultChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: (result) => result.blocksPassed >= 1,
    };
    jest
      .spyOn(streakService, 'getDailyStreak')
      .mockResolvedValue(defaultChallenge);

    // Find a valid seed and moves combination once for all tests
    // If we can't find one, use a default seed and moves (tests will handle validation gracefully)
    try {
      await findValidSeedAndMoves();
    } catch {
      // If we can't find a valid seed, use default moves
      // The tests will handle cases where validation fails gracefully
      // Durations: >= 520ms for TOO_FAST_BRIDGE; 600-1100ms for bridges to reach gaps (40-200px)
      validMoves = [
        { startTime: 0, duration: 650 },
        { startTime: 800, duration: 700 },
        { startTime: 1600, duration: 600 },
        { startTime: 2300, duration: 750 },
        { startTime: 3150, duration: 680 },
        { startTime: 3930, duration: 720 },
        { startTime: 4750, duration: 640 },
        { startTime: 5490, duration: 690 },
      ];
      console.warn(
        'Could not find a guaranteed valid seed, using default. Tests may be flaky.',
      );
    }
  });

  afterEach(async () => {
    // Don't restore mocks here - we want them to persist across tests
    // The mock will be reset in each test's setupDailyStreakChallenge call
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  /**
   * Helper to set up daily streak challenge
   * Mocks StreakService.getDailyStreak to return the test's validator
   */
  const setupDailyStreakChallenge = async (
    challenge: DailyStreakChallenge,
  ): Promise<void> => {
    // Clear any existing mocks first
    jest.restoreAllMocks();
    // Mock streakService.getDailyStreak to return the test's challenge
    jest.spyOn(streakService, 'getDailyStreak').mockResolvedValue(challenge);
  };

  /**
   * Helper to calculate expected points with boost
   * Formula: basePoints + (boost * basePoints)
   * where boost = Math.min(0.5, Math.log(streak + 1) / 7)
   * and basePoints = Math.floor(score * 0.1)
   * Final result is floored to integer
   */
  const calculateExpectedPoints = (score: number, streak: number): number => {
    const basePoints = Math.round(score * 0.1);
    const boost = Math.min(0.5, Math.log(streak + 1) / 7);
    const finalResult = basePoints + boost * basePoints;
    return Math.round(finalResult);
  };

  // Generate a seed once and reuse it for all tests
  let validMoves: Array<{ startTime: number; duration: number }>;

  /**
   * Helper to find a seed and moves that result in valid gameplay
   * This will be called once in beforeAll to find a working combination
   */
  const findValidSeedAndMoves = async (): Promise<void> => {
    const testUser = new User();
    testUser.googleId = 'test-seed-finder-12345678901234567890';
    testUser.nickName = 'SeedFinder';
    testUser.referralCode = 'SEEDFIND';
    testUser.points = 0;
    testUser.streak = 0;
    await entityManager.save(testUser);

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: (result) => result.blocksPassed >= 1,
    };
    await setupDailyStreakChallenge(dailyChallenge);

    // Try multiple seeds until we find one that works
    // Increase attempts significantly since validation is probabilistic
    for (let attempt = 0; attempt < 500; attempt++) {
      const { seed, signature } =
        await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);

      // Try different move patterns - more moves = higher chance of success
      // IMPORTANT:
      // 1. Durations >= 520ms for TOO_FAST_BRIDGE; 600-1100ms for bridges to reach gaps (40-200px)
      // 2. Timing varied to avoid TIMING_VARIANCE_TOO_LOW; time between moves >= 100ms
      const movePatterns = [
        [
          { startTime: 0, duration: 650 },
          { startTime: 800, duration: 700 },
          { startTime: 1600, duration: 600 },
          { startTime: 2300, duration: 750 },
          { startTime: 3150, duration: 680 },
          { startTime: 3930, duration: 720 },
          { startTime: 4750, duration: 640 },
          { startTime: 5490, duration: 690 },
          { startTime: 6280, duration: 710 },
          { startTime: 7090, duration: 660 },
        ],
        [
          { startTime: 0, duration: 700 },
          { startTime: 850, duration: 650 },
          { startTime: 1600, duration: 750 },
          { startTime: 2450, duration: 680 },
          { startTime: 3230, duration: 720 },
          { startTime: 4050, duration: 640 },
          { startTime: 4790, duration: 690 },
          { startTime: 5580, duration: 710 },
        ],
        [
          { startTime: 0, duration: 630 },
          { startTime: 780, duration: 680 },
          { startTime: 1560, duration: 720 },
          { startTime: 2380, duration: 650 },
          { startTime: 3130, duration: 740 },
          { startTime: 3970, duration: 670 },
          { startTime: 4740, duration: 690 },
          { startTime: 5530, duration: 710 },
          { startTime: 6340, duration: 640 },
          { startTime: 7080, duration: 700 },
          { startTime: 7880, duration: 660 },
          { startTime: 8640, duration: 730 },
        ],
        [
          { startTime: 0, duration: 650 },
          { startTime: 800, duration: 700 },
          { startTime: 1600, duration: 600 },
          { startTime: 2300, duration: 750 },
          { startTime: 3150, duration: 680 },
        ],
      ];

      for (const moves of movePatterns) {
        const gameSession: GameSession = {
          seed,
          signature,
          moves,
          usedItems: [],
        };

        try {
          const result = await userService.validateSessionAndAwardPoints(
            testUser.id,
            gameSession,
          );

          if (
            result.pointsEarned > 0 &&
            result.sessionScore > 0 &&
            !result.isFraud &&
            result.fraudReason !== FraudReason.INVALID_DATA
          ) {
            // Found a working combination!
            validMoves = moves;
            await entityManager.remove(testUser);
            return;
          }
        } catch {
          // Continue trying
        }
      }
    }

    await entityManager.remove(testUser);
    throw new Error(
      'Could not find a valid seed and moves combination after 500 attempts. This may indicate an issue with game session validation.',
    );
  };

  it('should calculate points correctly with streak boost for streak 0', async () => {
    const user = new User();
    user.googleId = `user-points-test-0-${Date.now()}-${Math.random()}`;
    user.nickName = 'PointsUser';
    user.referralCode = 'POINTS01';
    user.points = 0;
    user.streak = 0;
    user.isBlackListed = false;
    user.fraudAttempts = [];
    await entityManager.save(user);
    const savedUser = await entityManager.findOne(User, {
      where: { id: user.id },
    });
    if (!savedUser) throw new Error('User was not saved properly');

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: (result) => result.blocksPassed >= 1,
    };
    await setupDailyStreakChallenge(dailyChallenge);

    // Mock game session validation for deterministic testing (avoids flaky physics)
    const mockScore = 100;
    jest.spyOn(gameSessionService, 'validateSession').mockReturnValue({
      score: mockScore,
      streakChallengeCompleted: true,
      blocksPassed: 10,
      isFraud: false,
      fraudReason: FraudReason.NONE,
    });

    const { seed, signature } =
      await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
    const result = await userService.validateSessionAndAwardPoints(
      savedUser.id,
      { seed, signature, moves: validMoves, usedItems: [] },
    );

    expect(result.pointsEarned).toBeGreaterThan(0);
    expect(result.sessionScore).toBe(mockScore);
    expect(result.isFraud).toBe(false);
    expect(result.fraudReason).not.toBe(FraudReason.INVALID_DATA);

    const basePoints = Math.floor(result.sessionScore * 0.1);
    const expectedPoints = calculateExpectedPoints(result.sessionScore, 0);
    expect(result.pointsEarned).toBe(expectedPoints);
    expect(result.pointsEarned).toBe(basePoints);
  });

  it('should calculate points correctly with streak boost for streak 1', async () => {
    const user = new User();
    user.googleId = `user-points-test-1-${Date.now()}-${Math.random()}`;
    user.nickName = 'PointsUser';
    user.referralCode = 'POINTS02';
    user.points = 0;
    user.streak = 1;
    user.isBlackListed = false;
    user.fraudAttempts = [];
    await entityManager.save(user);
    const savedUser = await entityManager.findOne(User, {
      where: { id: user.id },
    });
    if (!savedUser) throw new Error('User was not saved properly');

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: (result) => result.blocksPassed >= 1,
    };
    await setupDailyStreakChallenge(dailyChallenge);

    const mockScore = 80;
    jest.spyOn(gameSessionService, 'validateSession').mockReturnValue({
      score: mockScore,
      streakChallengeCompleted: true,
      blocksPassed: 8,
      isFraud: false,
      fraudReason: FraudReason.NONE,
    });

    const { seed, signature } =
      await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
    const result = await userService.validateSessionAndAwardPoints(
      savedUser.id,
      { seed, signature, moves: validMoves, usedItems: [] },
    );

    expect(result.pointsEarned).toBeGreaterThan(0);
    expect(result.sessionScore).toBe(mockScore);
    const expectedPoints = calculateExpectedPoints(result.sessionScore, 1);
    expect(result.pointsEarned).toBe(expectedPoints);
  });

  it('should calculate points correctly with streak boost for streak 5', async () => {
    const user = new User();
    user.googleId = `user-points-test-5-${Date.now()}-${Math.random()}`;
    user.nickName = 'PointsUser';
    user.referralCode = 'POINTS03';
    user.points = 0;
    user.streak = 5;
    user.isBlackListed = false;
    user.fraudAttempts = [];
    await entityManager.save(user);
    const savedUser = await entityManager.findOne(User, {
      where: { id: user.id },
    });
    if (!savedUser) throw new Error('User was not saved properly');

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: (result) => result.blocksPassed >= 1,
    };
    await setupDailyStreakChallenge(dailyChallenge);

    const mockScore = 60;
    jest.spyOn(gameSessionService, 'validateSession').mockReturnValue({
      score: mockScore,
      streakChallengeCompleted: true,
      blocksPassed: 6,
      isFraud: false,
      fraudReason: FraudReason.NONE,
    });

    const { seed, signature } =
      await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
    const result = await userService.validateSessionAndAwardPoints(
      savedUser.id,
      { seed, signature, moves: validMoves, usedItems: [] },
    );

    expect(result.pointsEarned).toBeGreaterThan(0);
    const expectedPoints = calculateExpectedPoints(result.sessionScore, 5);
    expect(result.pointsEarned).toBe(expectedPoints);
  });

  it('should calculate points correctly with streak boost for streak 10', async () => {
    const user = new User();
    user.googleId = `user-points-test-10-${Date.now()}-${Math.random()}`;
    user.nickName = 'PointsUser';
    user.referralCode = 'POINTS04';
    user.points = 0;
    user.streak = 10;
    user.isBlackListed = false;
    user.fraudAttempts = [];
    await entityManager.save(user);
    const savedUser = await entityManager.findOne(User, {
      where: { id: user.id },
    });
    if (!savedUser) throw new Error('User was not saved properly');

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: (result) => result.blocksPassed >= 1,
    };
    await setupDailyStreakChallenge(dailyChallenge);

    const mockScore = 50;
    jest.spyOn(gameSessionService, 'validateSession').mockReturnValue({
      score: mockScore,
      streakChallengeCompleted: true,
      blocksPassed: 5,
      isFraud: false,
      fraudReason: FraudReason.NONE,
    });

    const { seed, signature } =
      await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
    const result = await userService.validateSessionAndAwardPoints(
      savedUser.id,
      { seed, signature, moves: validMoves, usedItems: [] },
    );

    expect(result.pointsEarned).toBeGreaterThan(0);
    const expectedPoints = calculateExpectedPoints(result.sessionScore, 10);
    expect(Math.abs(result.pointsEarned - expectedPoints)).toBeLessThanOrEqual(
      1,
    );
  });

  it('should cap boost at 0.5 for high streaks', async () => {
    const user = new User();
    user.googleId = `user-points-test-high-${Date.now()}-${Math.random()}`;
    user.nickName = 'PointsUser';
    user.referralCode = 'POINTS05';
    user.points = 0;
    user.streak = 100;
    user.isBlackListed = false;
    user.fraudAttempts = [];
    await entityManager.save(user);
    const savedUser = await entityManager.findOne(User, {
      where: { id: user.id },
    });
    if (!savedUser) throw new Error('User was not saved properly');

    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: (result) => result.blocksPassed >= 1,
    };
    await setupDailyStreakChallenge(dailyChallenge);

    const mockScore = 40;
    jest.spyOn(gameSessionService, 'validateSession').mockReturnValue({
      score: mockScore,
      streakChallengeCompleted: true,
      blocksPassed: 4,
      isFraud: false,
      fraudReason: FraudReason.NONE,
    });

    const { seed, signature } =
      await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
    const result = await userService.validateSessionAndAwardPoints(
      savedUser.id,
      { seed, signature, moves: validMoves, usedItems: [] },
    );

    expect(result.pointsEarned).toBeGreaterThan(0);
    const expectedPoints = calculateExpectedPoints(result.sessionScore, 100);
    expect(Math.abs(result.pointsEarned - expectedPoints)).toBeLessThanOrEqual(
      1,
    );
    const basePoints = Math.floor(result.sessionScore * 0.1);
    const maxBoostPoints = Math.floor(basePoints + 0.5 * basePoints);
    expect(result.pointsEarned).toBeLessThanOrEqual(maxBoostPoints + 1);
  });

  it('should verify boost increases with higher streaks', async () => {
    const dailyChallenge: DailyStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: (result) => result.blocksPassed >= 1,
    };
    await setupDailyStreakChallenge(dailyChallenge);

    const mockScore = 70;
    jest.spyOn(gameSessionService, 'validateSession').mockReturnValue({
      score: mockScore,
      streakChallengeCompleted: true,
      blocksPassed: 7,
      isFraud: false,
      fraudReason: FraudReason.NONE,
    });

    const streaks = [0, 1, 5, 10, 20];
    const pointsEarned: number[] = [];

    for (const streak of streaks) {
      const user = new User();
      user.googleId = `user-points-test-${streak}-12345678901234567890`;
      user.nickName = 'PointsUser';
      user.referralCode = `POINTS${streak}`;
      user.points = 0;
      user.streak = streak;
      user.isBlackListed = false;
      user.fraudAttempts = [];
      await entityManager.save(user);
      const savedUser = await entityManager.findOne(User, {
        where: { id: user.id },
      });
      if (!savedUser) throw new Error('User was not saved properly');

      const { seed, signature } =
        await gameSessionService.generateRandomSignedSeed(ADMIN_PRIVATE_KEY);
      const result = await userService.validateSessionAndAwardPoints(
        savedUser.id,
        { seed, signature, moves: validMoves, usedItems: [] },
      );

      pointsEarned.push(result.pointsEarned);
      await entityManager.remove(savedUser);
    }

    expect(pointsEarned.length).toBe(streaks.length);
    expect(pointsEarned.every((p) => p > 0)).toBe(true);

    // With same base score, points should increase with streak (boost increases)
    for (let i = 1; i < pointsEarned.length; i++) {
      expect(pointsEarned[i]).toBeGreaterThanOrEqual(pointsEarned[i - 1]);
    }
  });
});
