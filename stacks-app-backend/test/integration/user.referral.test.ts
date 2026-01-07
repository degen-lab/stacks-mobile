import {
  createTestDataSource,
  closeTestDataSource,
  cleanTestDatabase,
  getTestDataSource,
} from './testDataSource';
import { User } from '../../src/domain/entities/user';
import { EntityManager } from 'typeorm';
import { UserService } from '../../src/application/user/userService';
import { UserDomainService } from '../../src/domain/service/userDomainService';
import { GameSessionService } from '../../src/domain/service/gameSessionService';
import { StreakService } from '../../src/application/streaks/streakService';
import { StreaksDomainService } from '../../src/domain/service/streaksDomainService';
import { RedisCacheAdapter } from '../../src/infra/redis/cacheAdapter';
import { REFERRAL_BONUS } from '../../src/shared/constants';
import { ITransactionClient } from '../../src/application/ports/ITransactionClient';

describe('User Referral System Integration Tests', () => {
  let userService: UserService;
  let entityManager: EntityManager;
  let dataSource: ReturnType<typeof getTestDataSource>;
  let streakService: StreakService;
  let mockTransactionClient: jest.Mocked<ITransactionClient>;
  beforeAll(async () => {
    await createTestDataSource();
    dataSource = getTestDataSource();
    entityManager = dataSource.createEntityManager();

    mockTransactionClient = {
      getTournamentId: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<ITransactionClient>;

    const userDomainService = new UserDomainService();
    const gameSessionService = new GameSessionService();
    const cacheAdapter = new RedisCacheAdapter();
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
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  it('should award referral bonus to referrer when new user registers with valid referral code', async () => {
    // Create referrer user
    const referrer = new User();
    referrer.googleId = 'referrer-google-id-12345678901234567890';
    referrer.nickName = 'ReferrerUser';
    referrer.referralCode = 'REFERRER1';
    referrer.points = 0;
    await entityManager.save(referrer);

    const initialReferrerPoints = referrer.points;
    const referrerCode = referrer.referralCode;

    // Create new user with referral code
    const { user: newUser } = await userService.loginOrRegister(
      'new-user-google-id-12345678901234567890',
      'NewUser',
      'https://example.com/photo.jpg',
      referrerCode,
    );

    // Verify new user was created
    expect(newUser.id).toBeDefined();
    expect(newUser.googleId).toBe('new-user-google-id-12345678901234567890');

    // Verify referrer got bonus points
    const referrerAfter = await entityManager.findOne(User, {
      where: { id: referrer.id },
    });

    expect(referrerAfter?.points).toBe(initialReferrerPoints + REFERRAL_BONUS);
  });

  it('should award referral bonus twice when two users register with same referral code', async () => {
    // Create referrer user
    const referrer = new User();
    referrer.googleId = 'referrer-google-id-12345678901234567890';
    referrer.nickName = 'ReferrerUser';
    referrer.referralCode = 'REFERRER2';
    referrer.points = 0;
    await entityManager.save(referrer);

    const initialReferrerPoints = referrer.points;
    const referrerCode = referrer.referralCode;

    // Create first new user with referral code (use unique googleId to avoid referral code collision)
    const { user: newUser1 } = await userService.loginOrRegister(
      'first-referee-google-id-12345678901234567890',
      'NewUser1',
      'https://example.com/photo1.jpg',
      referrerCode,
    );

    // Verify first referral bonus
    const referrerAfterFirst = await entityManager.findOne(User, {
      where: { id: referrer.id },
    });
    expect(referrerAfterFirst?.points).toBe(
      initialReferrerPoints + REFERRAL_BONUS,
    );

    // Reload referrer to get fresh state before second referral
    const referrerReloaded = await entityManager.findOne(User, {
      where: { id: referrer.id },
    });
    const pointsAfterFirst = referrerReloaded!.points;

    // Create second new user with same referral code (use different unique googleId)
    const { user: newUser2 } = await userService.loginOrRegister(
      'second-referee-google-id-98765432109876543210',
      'NewUser2',
      'https://example.com/photo2.jpg',
      referrerCode,
    );

    // Verify referrer got bonus points for both referrals
    const referrerAfterSecond = await entityManager.findOne(User, {
      where: { id: referrer.id },
    });

    expect(referrerAfterSecond?.points).toBe(pointsAfterFirst + REFERRAL_BONUS);
    expect(referrerAfterSecond?.points).toBe(
      initialReferrerPoints + REFERRAL_BONUS * 2,
    );
    expect(newUser1.id).toBeDefined();
    expect(newUser2.id).toBeDefined();
  });

  it('should not award referral bonus when user tries to refer themselves', async () => {
    // Create user
    const user = new User();
    user.googleId = 'self-referrer-google-id-12345678901234567890';
    user.nickName = 'SelfReferrer';
    user.referralCode = 'SELFREF1';
    user.points = 0;
    await entityManager.save(user);

    const initialPoints = user.points;
    const userReferralCode = user.referralCode;

    // Try to register with own referral code (should not work)
    // Note: The code checks if referrer.googleId !== googleId, so this should not award bonus
    const { user: sameUser } = await userService.loginOrRegister(
      'self-referrer-google-id-12345678901234567890',
      'SelfReferrer',
      userReferralCode,
    );

    // Should return existing user, not create new one
    expect(sameUser.id).toBe(user.id);

    // Verify no bonus points were awarded
    const userAfter = await entityManager.findOne(User, {
      where: { id: user.id },
    });

    expect(userAfter?.points).toBe(initialPoints);
  });

  it('should not award referral bonus when referral code is invalid', async () => {
    // Create referrer user
    const referrer = new User();
    referrer.googleId = 'referrer-google-id-12345678901234567890';
    referrer.nickName = 'ReferrerUser';
    referrer.referralCode = 'REFERRER3';
    referrer.points = 0;
    await entityManager.save(referrer);

    const initialReferrerPoints = referrer.points;

    // Create new user with invalid referral code
    const { user: newUser } = await userService.loginOrRegister(
      'new-user-google-id-12345678901234567890',
      'NewUser',
      'INVALID123', // Invalid referral code
    );

    // Verify new user was created
    expect(newUser.id).toBeDefined();

    // Verify referrer did NOT get bonus points
    const referrerAfter = await entityManager.findOne(User, {
      where: { id: referrer.id },
    });

    expect(referrerAfter?.points).toBe(initialReferrerPoints);
  });

  it('should not award referral bonus when referral code is not provided', async () => {
    // Create referrer user
    const referrer = new User();
    referrer.googleId = 'referrer-google-id-12345678901234567890';
    referrer.nickName = 'ReferrerUser';
    referrer.referralCode = 'REFERRER4';
    referrer.points = 0;
    await entityManager.save(referrer);

    const initialReferrerPoints = referrer.points;

    // Create new user without referral code
    const newUser = await userService.loginOrRegister(
      'new-user-google-id-12345678901234567890',
      'NewUser',
    );

    // Verify new user was created
    expect(newUser.user.id).toBeDefined();

    // Verify referrer did NOT get bonus points
    const referrerAfter = await entityManager.findOne(User, {
      where: { id: referrer.id },
    });

    expect(referrerAfter?.points).toBe(initialReferrerPoints);
  });
});
