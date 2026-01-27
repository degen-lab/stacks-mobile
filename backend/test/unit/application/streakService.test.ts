import { EntityManager } from 'typeorm';
import { StreakService } from '../../../src/application/streaks/streakService';
import { StreaksDomainService } from '../../../src/domain/service/streaksDomainService';
import { CachePort } from '../../../src/application/ports/cachePort';
import { User } from '../../../src/domain/entities/user';
import { DailyStreakChallengeNotFoundError } from '../../../src/application/errors/streakErrors';
import { DailyStreakChallenge } from '../../../src/shared/types';

describe('StreakService unit tests', () => {
  let streakService: StreakService;
  let mockStreaksDomainService: jest.Mocked<StreaksDomainService>;
  let mockCacheManager: jest.Mocked<CachePort>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(() => {
    mockStreaksDomainService = {
      getDailyStreak: jest.fn(),
      chooseRandomChallenge: jest.fn(),
    } as unknown as jest.Mocked<StreaksDomainService>;

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CachePort>;

    mockEntityManager = {
      find: jest.fn(),
      save: jest.fn(),
      transaction: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    streakService = new StreakService(
      mockStreaksDomainService,
      mockCacheManager,
      mockEntityManager,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resetUsersStreak', () => {
    it('should reset streak for users who did not complete yesterday challenge', async () => {
      const today = new Date('2024-01-15T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(today);

      // User who completed challenge 2 days ago (should be reset - didn't complete yesterday)
      const user1 = new User();
      user1.id = 1;
      user1.streak = 5;
      user1.lastStreakCompletionDate = new Date('2024-01-13T10:00:00Z');

      // User who completed challenge yesterday (should NOT be reset - completed yesterday)
      const user2 = new User();
      user2.id = 2;
      user2.streak = 3;
      user2.lastStreakCompletionDate = new Date('2024-01-14T15:00:00Z');

      // User who never completed a challenge (should NOT be reset - no date to compare)
      const user3 = new User();
      user3.id = 3;
      user3.streak = 0;
      user3.lastStreakCompletionDate = undefined;

      // User who completed challenge today (should NOT be reset - completed today)
      const user4 = new User();
      user4.id = 4;
      user4.streak = 2;
      user4.lastStreakCompletionDate = new Date('2024-01-15T08:00:00Z');

      // User who completed exactly at start of yesterday (should NOT be reset - completed yesterday)
      const user5 = new User();
      user5.id = 5;
      user5.streak = 7;
      user5.lastStreakCompletionDate = new Date('2024-01-14T00:00:00Z');

      const mockTransactionManager = {
        find: jest.fn().mockResolvedValue([user1, user2, user3, user4, user5]),
        save: jest.fn().mockResolvedValue(undefined),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback(mockTransactionManager);
        },
      );

      await streakService.resetUsersStreak();

      expect(mockEntityManager.transaction).toHaveBeenCalledTimes(1);
      expect(mockTransactionManager.find).toHaveBeenCalledWith(User);

      // User1 should have streak reset to 0 (completed 2 days ago, before yesterday)
      expect(user1.streak).toBe(0);
      expect(mockTransactionManager.save).toHaveBeenCalledWith(user1);

      // User2 should keep their streak (completed yesterday afternoon - should NOT reset)
      expect(user2.streak).toBe(3);
      // Should NOT be saved because streak wasn't reset

      // User3 should keep streak at 0 (never completed, no date to compare - should NOT reset)
      expect(user3.streak).toBe(0);
      // Should NOT be saved because streak wasn't reset

      // User4 should keep their streak (completed today - should NOT reset)
      expect(user4.streak).toBe(2);
      // Should NOT be saved because streak wasn't reset

      // User5 should keep their streak (completed at start of yesterday, which counts as yesterday - should NOT reset)
      expect(user5.streak).toBe(7);
      // Should NOT be saved because streak wasn't reset

      // Only user1 should be saved (the one whose streak was reset)
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('should NOT reset streak for users who completed challenge at start of yesterday', async () => {
      const today = new Date('2024-01-15T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(today);

      // User who completed exactly at start of yesterday (00:00:00)
      // This should NOT reset because they completed it yesterday (even at 00:00:00)
      const user = new User();
      user.id = 1;
      user.streak = 5;
      const yesterdayStart = new Date('2024-01-14T00:00:00Z');
      user.lastStreakCompletionDate = yesterdayStart;

      const mockTransactionManager = {
        find: jest.fn().mockResolvedValue([user]),
        save: jest.fn().mockResolvedValue(undefined),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback(mockTransactionManager);
        },
      );

      await streakService.resetUsersStreak();

      // Should NOT reset because they completed at start of yesterday (which counts as yesterday)
      expect(user.streak).toBe(5);
      // Should NOT be saved because streak wasn't reset
      expect(mockTransactionManager.save).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should handle empty users array', async () => {
      const mockTransactionManager = {
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn(),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback(mockTransactionManager);
        },
      );

      await streakService.resetUsersStreak();

      expect(mockEntityManager.transaction).toHaveBeenCalledTimes(1);
      expect(mockTransactionManager.find).toHaveBeenCalledWith(User);
      expect(mockTransactionManager.save).not.toHaveBeenCalled();
    });

    it('should handle users with null lastStreakCompletionDate', async () => {
      const user = new User();
      user.id = 1;
      user.streak = 10;
      user.lastStreakCompletionDate = null as unknown as Date;

      const mockTransactionManager = {
        find: jest.fn().mockResolvedValue([user]),
        save: jest.fn().mockResolvedValue(undefined),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback(mockTransactionManager);
        },
      );

      await streakService.resetUsersStreak();

      // Should not reset because lastStreakCompletionDate is null
      expect(user.streak).toBe(10);
      // Should NOT be saved because streak wasn't reset
      expect(mockTransactionManager.save).not.toHaveBeenCalled();
    });

    it('should rollback transaction if save fails', async () => {
      const user1 = new User();
      user1.id = 1;
      user1.streak = 5;
      user1.lastStreakCompletionDate = new Date('2024-01-10T10:00:00Z');

      const user2 = new User();
      user2.id = 2;
      user2.streak = 3;
      user2.lastStreakCompletionDate = new Date('2024-01-10T10:00:00Z');

      const mockTransactionManager = {
        find: jest.fn().mockResolvedValue([user1, user2]),
        save: jest
          .fn()
          .mockResolvedValueOnce(undefined)
          .mockRejectedValueOnce(new Error('Save failed')),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback(mockTransactionManager);
        },
      );

      await expect(streakService.resetUsersStreak()).rejects.toThrow(
        'Save failed',
      );

      // Both users should have their streaks reset in memory (before save)
      expect(user1.streak).toBe(0);
      expect(user2.streak).toBe(0);
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(2);
      // Transaction should rollback, so changes won't persist
    });

    it('should correctly reset streak for users who completed before yesterday', async () => {
      const today = new Date('2024-01-15T10:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(today);

      const user = new User();
      user.id = 1;
      user.streak = 5;
      // Completed 2 days ago (before yesterday)
      user.lastStreakCompletionDate = new Date('2024-01-13T10:00:00Z');

      const mockTransactionManager = {
        find: jest.fn().mockResolvedValue([user]),
        save: jest.fn().mockResolvedValue(undefined),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback(mockTransactionManager);
        },
      );

      await streakService.resetUsersStreak();

      // Should reset because lastStreakCompletionDate (Jan 13) is before yesterday (Jan 14 00:00:00)
      expect(user.streak).toBe(0);
      expect(mockTransactionManager.save).toHaveBeenCalledWith(user);

      jest.useRealTimers();
    });

    it('should handle edge case at month boundary correctly', async () => {
      const today = new Date('2024-02-01T10:00:00Z'); // First day of month
      jest.useFakeTimers();
      jest.setSystemTime(today);

      // User who completed on last day of previous month (Jan 31)
      // Yesterday would be Jan 31 at 00:00:00
      // If completed on Jan 31, they completed yesterday, so should NOT reset
      const user1 = new User();
      user1.id = 1;
      user1.streak = 5;
      user1.lastStreakCompletionDate = new Date('2024-01-31T10:00:00Z');

      // User who completed on Jan 30 (before yesterday Jan 31)
      // Should be reset
      const user2 = new User();
      user2.id = 2;
      user2.streak = 3;
      user2.lastStreakCompletionDate = new Date('2024-01-30T10:00:00Z');

      const mockTransactionManager = {
        find: jest.fn().mockResolvedValue([user1, user2]),
        save: jest.fn().mockResolvedValue(undefined),
      } as unknown as EntityManager;

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return await callback(mockTransactionManager);
        },
      );

      await streakService.resetUsersStreak();

      // User1 should NOT reset (completed yesterday - Jan 31)
      expect(user1.streak).toBe(5);
      // Should NOT be saved because streak wasn't reset

      // User2 should reset (completed before yesterday - Jan 30 < Jan 31)
      expect(user2.streak).toBe(0);
      expect(mockTransactionManager.save).toHaveBeenCalledWith(user2);

      // Only user2 should be saved (the one whose streak was reset)
      expect(mockTransactionManager.save).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });

  describe('getDailyStreak', () => {
    it('should throw error when challenge index is not found in cache', async () => {
      mockCacheManager.get.mockResolvedValueOnce(null);

      await expect(streakService.getDailyStreak()).rejects.toThrow(
        DailyStreakChallengeNotFoundError,
      );

      expect(mockCacheManager.get).toHaveBeenCalledWith('dailyStreakChallenge');
    });

    it('should return challenge when it exists in cache', async () => {
      const challenge: DailyStreakChallenge = {
        id: 1,
        description: 'Pass at least 10 blocks in a single session',
        validator: jest.fn(),
      };

      mockCacheManager.get.mockResolvedValueOnce(challenge);

      const result = await streakService.getDailyStreak();

      expect(mockCacheManager.get).toHaveBeenCalledWith('dailyStreakChallenge');
      expect(result.description).toEqual(challenge.description);
      expect(result.validator).toBeDefined();
    });
  });

  describe('setDailyStreak', () => {
    it('should set new daily streak challenge in cache', async () => {
      const challenge: DailyStreakChallenge = {
        id: 1,
        description: 'New challenge',
        validator: jest.fn(),
      };

      mockStreaksDomainService.chooseRandomChallenge.mockReturnValue(challenge);
      mockCacheManager.set.mockResolvedValueOnce(undefined);

      const result = await streakService.setDailyStreak();

      expect(mockStreaksDomainService.chooseRandomChallenge).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'dailyStreakChallenge',
        challenge,
      );
      expect(result).toEqual(challenge);
    });
  });
});
