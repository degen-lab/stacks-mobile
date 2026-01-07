import { RewardsCalculator } from '../../../src/domain/service/rewardsCalculator';
import { Submission } from '../../../src/domain/entities/submission';
import { User } from '../../../src/domain/entities/user';
import { SubmissionType } from '../../../src/domain/entities/enums';
import { SubmissionTier } from '../../../src/domain/helpers/types';

describe('RewardsCalculator domain class Unit tests', () => {
  let rewardsCalculator: RewardsCalculator;

  beforeEach(() => {
    rewardsCalculator = new RewardsCalculator();
  });

  const createSubmission = (
    id: number,
    score: number,
    userId: number,
  ): Submission => {
    const submission = new Submission();
    submission.id = id;
    submission.score = score;
    submission.tournamentId = 1;
    submission.type = SubmissionType.WeeklyContest;
    submission.tier = SubmissionTier.None;
    submission.transactionId = `tx-${id}`;
    submission.stacksAddress = `ST${'1'.repeat(39)}`;
    submission.user = new User();
    submission.user.id = userId;
    return submission;
  };

  describe('computeThreshold', () => {
    it('should sort submissions by score in descending order', () => {
      const submissions = [
        createSubmission(1, 100, 1),
        createSubmission(2, 500, 2),
        createSubmission(3, 200, 3),
        createSubmission(4, 300, 4),
      ];

      const result = rewardsCalculator.computeThreshold(submissions);

      // Verify sorting: highest scores first
      expect(result.gold[0]?.score).toBeGreaterThanOrEqual(
        result.silver[0]?.score || 0,
      );
      if (result.silver.length > 0 && result.bronze.length > 0) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(result.silver[0]?.score).toBeGreaterThanOrEqual(
          result.bronze[0]?.score || 0,
        );
      }
    });

    it('should correctly calculate gold, silver, and bronze tiers for 36 submissions', () => {
      // For 36 submissions: rewardedUsersCount = min(36, 1000, floor(1.5 * sqrt(36))) = min(36, 1000, 9) = 9
      // goldCount = max(floor(9/6), 1) = max(1, 1) = 1
      // silverCount = max(1 + floor(18/6), 1) = max(1 + 3, 1) = 4
      // bronzeCount = max(4 + floor(27/6), 1) = max(4 + 4, 1) = 8
      // bronzeCount (8) <= rewardedUsersCount (9), so it should NOT throw
      // gold: 1 item, silver: 3 items (4-1), bronze: 4 items (8-4), total: 8 items

      const submissions = Array.from({ length: 36 }, (_, i) =>
        createSubmission(i + 1, 1000 - i * 10, i + 1),
      );

      const result = rewardsCalculator.computeThreshold(submissions);

      expect(result.gold).toHaveLength(1);
      expect(result.silver).toHaveLength(3); // silverCount - goldCount = 4 - 1
      expect(result.bronze).toHaveLength(5); // bronzeCount - silverCount = 9 - 4 (bronzeCount equals rewardedUsersCount)
      expect(
        result.gold.length + result.silver.length + result.bronze.length,
      ).toBe(9);
    });

    it('should correctly distribute rewards for 100 submissions', () => {
      // For 100 submissions: rewardedUsersCount = min(100, 1000, floor(1.5 * sqrt(100))) = min(100, 1000, 15) = 15
      // goldCount = max(floor(15/6), 1) = max(2, 1) = 2
      // silverCount = max(2 + floor(30/6), 1) = max(2 + 5, 1) = 7
      // bronzeCount = max(7 + floor(45/6), 1) = max(7 + 7, 1) = 14
      // bronzeCount (14) <= rewardedUsersCount (15), so it should NOT throw
      // gold: 2 items, silver: 5 items (7-2), bronze: 7 items (14-7), total: 14 items

      const submissions = Array.from({ length: 100 }, (_, i) =>
        createSubmission(i + 1, 10000 - i * 50, i + 1),
      );

      const result = rewardsCalculator.computeThreshold(submissions);

      expect(result.gold).toHaveLength(2);
      expect(result.silver).toHaveLength(5); // silverCount - goldCount = 7 - 2
      expect(result.bronze).toHaveLength(8); // bronzeCount - silverCount = 15 - 7 (bronzeCount equals rewardedUsersCount)
      expect(
        result.gold.length + result.silver.length + result.bronze.length,
      ).toBe(15);
    });

    it('should ensure gold tier has highest scores', () => {
      const submissions = Array.from({ length: 50 }, (_, i) =>
        createSubmission(i + 1, 1000 - i * 10, i + 1),
      );

      const result = rewardsCalculator.computeThreshold(submissions);

      expect(result.gold.length).toBeGreaterThan(0);
      expect(result.silver.length).toBeGreaterThan(0);
      const minGoldScore = Math.min(...result.gold.map((s) => s.score));
      const maxSilverScore = Math.max(...result.silver.map((s) => s.score));
      expect(minGoldScore).toBeGreaterThanOrEqual(maxSilverScore);
    });

    it('should ensure silver tier scores are between gold and bronze', () => {
      const submissions = Array.from({ length: 25 }, (_, i) =>
        createSubmission(i + 1, 1000 - i * 20, i + 1),
      );

      const result = rewardsCalculator.computeThreshold(submissions);

      expect(result.gold.length).toBeGreaterThan(0);
      expect(result.silver.length).toBeGreaterThan(0);
      expect(result.bronze.length).toBeGreaterThan(0);
      const minGoldScore = Math.min(...result.gold.map((s) => s.score));
      const maxSilverScore = Math.max(...result.silver.map((s) => s.score));
      const minSilverScore = Math.min(...result.silver.map((s) => s.score));
      const maxBronzeScore = Math.max(...result.bronze.map((s) => s.score));

      expect(minGoldScore).toBeGreaterThanOrEqual(maxSilverScore);
      expect(minSilverScore).toBeGreaterThanOrEqual(maxBronzeScore);
    });

    it('should handle empty submissions array', () => {
      const submissions: Submission[] = [];

      // For 0 submissions: rewardedUsersCount = min(0, 1000, 0) = 0
      // goldCount = max(floor(0/6), 1) = max(0, 1) = 1
      // This will cause an issue since we have 0 submissions but need 1 for gold

      expect(() => {
        rewardsCalculator.computeThreshold(submissions);
      }).toThrow();
    });

    it('should handle single submission', () => {
      const submissions = [createSubmission(1, 1000, 1)];

      // For 1 submission: rewardedUsersCount = min(1, 1000, floor(1.5 * sqrt(1))) = min(1, 1000, 1) = 1
      // goldCount = max(floor(1/6), 1) = max(0, 1) = 1
      // silverCount = max(1 + floor(2/6), 1) = max(1 + 0, 1) = 1
      // bronzeCount = max(1 + floor(3/6), 1) = max(1 + 0, 1) = 1
      // bronzeCount (1) <= rewardedUsersCount (1), so it should NOT throw
      // But wait, bronzeCount = 1 means slice(silverCount=1, bronzeCount=1) = empty array
      // This is a valid case - only gold gets rewarded

      const result = rewardsCalculator.computeThreshold(submissions);

      expect(result.gold).toHaveLength(1);
      expect(result.silver).toHaveLength(0); // slice(1, 1) = empty
      expect(result.bronze).toHaveLength(0); // slice(1, 1) = empty
    });

    it('should respect MAX_REWARDED limit', () => {
      const submissions = Array.from({ length: 2000 }, (_, i) =>
        createSubmission(i + 1, 10000 - i * 5, i + 1),
      );

      // For 2000 submissions: rewardedUsersCount = min(2000, 1000, floor(1.5 * sqrt(2000))) = min(2000, 1000, 67) = 67
      // TUNNING_CONSTANT limits it to 67, not MAX_REWARDED
      // goldCount = max(floor(67/6), 1) = max(11, 1) = 11
      // silverCount = max(11 + floor(134/6), 1) = max(11 + 22, 1) = 33
      // bronzeCount = max(33 + floor(201/6), 1) = max(33 + 33, 1) = 66
      // bronzeCount (66) <= rewardedUsersCount (67), so it should NOT throw

      const result = rewardsCalculator.computeThreshold(submissions);

      expect(result.gold).toHaveLength(11);
      expect(result.silver).toHaveLength(22); // silverCount - goldCount = 33 - 11
      expect(result.bronze).toHaveLength(34); // bronzeCount - silverCount = 67 - 33 (bronzeCount equals rewardedUsersCount)
      expect(
        result.gold.length + result.silver.length + result.bronze.length,
      ).toBe(67);
    });

    it('should use TUNNING_CONSTANT in calculation', () => {
      const submissions = Array.from({ length: 16 }, (_, i) =>
        createSubmission(i + 1, 1000 - i * 10, i + 1),
      );

      // For 16 submissions: rewardedUsersCount = min(16, 1000, floor(1.5 * sqrt(16))) = min(16, 1000, 6) = 6
      // TUNNING_CONSTANT limits it to 6 instead of 16
      // goldCount = max(floor(6/6), 1) = max(1, 1) = 1
      // silverCount = max(1 + floor(12/6), 1) = max(1 + 2, 1) = 3
      // bronzeCount = max(3 + floor(18/6), 1) = max(3 + 3, 1) = 6
      // bronzeCount (6) <= rewardedUsersCount (6), so it should NOT throw

      const result = rewardsCalculator.computeThreshold(submissions);

      expect(result.gold).toHaveLength(1);
      expect(result.silver).toHaveLength(2); // silverCount - goldCount = 3 - 1
      expect(result.bronze).toHaveLength(3); // bronzeCount - silverCount = 6 - 3
      expect(
        result.gold.length + result.silver.length + result.bronze.length,
      ).toBe(6);
    });

    it('should return submissions in correct order (highest to lowest)', () => {
      const submissions = [
        createSubmission(1, 100, 1),
        createSubmission(2, 500, 2),
        createSubmission(3, 300, 3),
        createSubmission(4, 200, 4),
        createSubmission(5, 400, 5),
        createSubmission(6, 600, 6),
      ];

      const result = rewardsCalculator.computeThreshold(submissions);

      // Verify all results are sorted descending
      const allSubmissions = [
        ...result.gold,
        ...result.silver,
        ...result.bronze,
      ];
      for (let i = 0; i < allSubmissions.length - 1; i++) {
        expect(allSubmissions[i].score).toBeGreaterThanOrEqual(
          allSubmissions[i + 1].score,
        );
      }
    });
  });
});
