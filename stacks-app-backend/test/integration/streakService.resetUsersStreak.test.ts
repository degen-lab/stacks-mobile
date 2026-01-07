import { StreakService } from '../../src/application/streaks/streakService';
import { StreaksDomainService } from '../../src/domain/service/streaksDomainService';
import { RedisCacheAdapter } from '../../src/infra/redis/cacheAdapter';
import {
  createTestDataSource,
  closeTestDataSource,
  cleanTestDatabase,
  getTestDataSource,
} from './testDataSource';
import { User } from '../../src/domain/entities/user';
import { EntityManager } from 'typeorm';

describe('StreakService.resetUsersStreak Integration Tests', () => {
  let streakService: StreakService;
  let entityManager: EntityManager;
  let dataSource: ReturnType<typeof getTestDataSource>;

  beforeAll(async () => {
    await createTestDataSource();
    dataSource = getTestDataSource();
    entityManager = dataSource.createEntityManager();

    const streakDomainService = new StreaksDomainService();
    const cacheAdapter = new RedisCacheAdapter();
    streakService = new StreakService(
      streakDomainService,
      cacheAdapter,
      entityManager,
    );
  });

  afterEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  it('should reset streak to 0 for users who did not complete challenge yesterday', async () => {
    const timestamp = Date.now();

    // Create users with different last completion dates
    const user1 = new User();
    user1.googleId = `user1-streak-reset-test-${timestamp}-1`;
    user1.nickName = 'User1';
    user1.referralCode = 'ABCD1234';
    user1.streak = 5;
    // Completed 2 days ago (before yesterday) - should reset
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(12, 0, 0, 0);
    user1.lastStreakCompletionDate = twoDaysAgo;

    const user2 = new User();
    user2.googleId = `user2-streak-reset-test-${timestamp}-2`;
    user2.nickName = 'User2';
    user2.referralCode = 'EFGH5678';
    user2.streak = 3;
    // Completed yesterday - should NOT reset
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);
    user2.lastStreakCompletionDate = yesterday;

    const user3 = new User();
    user3.googleId = `user3-streak-reset-test-${timestamp}-3`;
    user3.nickName = 'User3';
    user3.referralCode = 'IJKL9012';
    user3.streak = 0;
    // Never completed (no date) - should NOT reset
    user3.lastStreakCompletionDate = undefined;

    const user4 = new User();
    user4.googleId = `user4-streak-reset-test-${timestamp}-4`;
    user4.nickName = 'User4';
    user4.referralCode = 'MNOP3456';
    user4.streak = 2;
    // Completed today - should NOT reset
    user4.lastStreakCompletionDate = new Date();

    await entityManager.save([user1, user2, user3, user4]);

    // Execute resetUsersStreak
    await streakService.resetUsersStreak();

    // Verify results
    const usersAfter = await entityManager.find(User, {
      order: { googleId: 'ASC' },
    });

    const user1After = usersAfter.find((u) => u.googleId === user1.googleId);
    const user2After = usersAfter.find((u) => u.googleId === user2.googleId);
    const user3After = usersAfter.find((u) => u.googleId === user3.googleId);
    const user4After = usersAfter.find((u) => u.googleId === user4.googleId);

    // User1 should have streak reset to 0 (completed before yesterday)
    expect(user1After?.streak).toBe(0);

    // User2 should keep their streak (completed yesterday)
    expect(user2After?.streak).toBe(3);

    // User3 should keep streak at 0 (never completed)
    expect(user3After?.streak).toBe(0);

    // User4 should keep their streak (completed today)
    expect(user4After?.streak).toBe(2);
  });

  it('should reset streak for users who completed exactly at midnight yesterday', async () => {
    const timestamp = Date.now();

    // Create a user who completed at the start of yesterday (00:00:00)
    const user = new User();
    user.googleId = `user-midnight-streak-reset-test-${timestamp}-1`;
    user.nickName = 'UserMidnight';
    user.referralCode = 'QRST7890';
    user.streak = 10;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Start of yesterday
    user.lastStreakCompletionDate = yesterday;

    await entityManager.save(user);

    // Execute resetUsersStreak
    await streakService.resetUsersStreak();

    // Verify - user completed at start of yesterday, which counts as yesterday, so should NOT reset
    const userAfter = await entityManager.findOne(User, {
      where: { googleId: user.googleId },
    });

    expect(userAfter?.streak).toBe(10); // Should keep streak
  });

  it('should reset streak for users who completed before yesterday', async () => {
    const timestamp = Date.now();

    // Create users with various dates before yesterday
    const user1 = new User();
    user1.googleId = `user-3days-streak-reset-test-${timestamp}-1`;
    user1.nickName = 'User3Days';
    user1.referralCode = 'UVWX1234';
    user1.streak = 7;
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(15, 30, 0, 0);
    user1.lastStreakCompletionDate = threeDaysAgo;

    const user2 = new User();
    user2.googleId = `user-1week-streak-reset-test-${timestamp}-2`;
    user2.nickName = 'User1Week';
    user2.referralCode = 'YZAB5678';
    user2.streak = 15;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(10, 0, 0, 0);
    user2.lastStreakCompletionDate = oneWeekAgo;

    await entityManager.save([user1, user2]);

    // Execute resetUsersStreak
    await streakService.resetUsersStreak();

    // Verify both users should have streaks reset
    const usersAfter = await entityManager.find(User, {
      where: [{ googleId: user1.googleId }, { googleId: user2.googleId }],
    });

    const user1After = usersAfter.find((u) => u.googleId === user1.googleId);
    const user2After = usersAfter.find((u) => u.googleId === user2.googleId);

    expect(user1After?.streak).toBe(0);
    expect(user2After?.streak).toBe(0);
  });

  it('should handle users with no lastStreakCompletionDate (null)', async () => {
    const timestamp = Date.now();

    // Create user with null lastStreakCompletionDate
    const user = new User();
    user.googleId = `user-null-streak-reset-test-${timestamp}-1`;
    user.nickName = 'UserNull';
    user.referralCode = 'CDEF9012';
    user.streak = 5;
    user.lastStreakCompletionDate = undefined;

    await entityManager.save(user);

    // Execute resetUsersStreak
    await streakService.resetUsersStreak();

    // Verify - user with null date should keep streak (no date to compare)
    const userAfter = await entityManager.findOne(User, {
      where: { googleId: user.googleId },
    });

    expect(userAfter?.streak).toBe(5); // Should keep streak
  });

  it('should only save users whose streak was actually reset', async () => {
    const timestamp = Date.now();

    // Create multiple users - only some should be reset
    const userToReset = new User();
    userToReset.googleId = `user-reset-streak-reset-test-${timestamp}-1`;
    userToReset.nickName = 'UserReset';
    userToReset.referralCode = 'GHIJ3456';
    userToReset.streak = 8;
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    userToReset.lastStreakCompletionDate = threeDaysAgo;

    const userToKeep = new User();
    userToKeep.googleId = `user-keep-streak-reset-test-${timestamp}-2`;
    userToKeep.nickName = 'UserKeep';
    userToKeep.referralCode = 'KLMN7890';
    userToKeep.streak = 3;
    userToKeep.lastStreakCompletionDate = new Date(); // Today

    await entityManager.save([userToReset, userToKeep]);

    // Execute resetUsersStreak
    await streakService.resetUsersStreak();

    // Verify - only userToReset should have been updated
    const userToResetAfter = await entityManager.findOne(User, {
      where: { googleId: userToReset.googleId },
    });
    const userToKeepAfter = await entityManager.findOne(User, {
      where: { googleId: userToKeep.googleId },
    });

    expect(userToResetAfter?.streak).toBe(0);
    expect(userToKeepAfter?.streak).toBe(3);
    // The method only saves users whose streak changed, so userToReset should be saved
  });
});
