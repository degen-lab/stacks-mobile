import {
  createTestDataSource,
  closeTestDataSource,
  cleanTestDatabase,
  getTestDataSource,
} from './testDataSource';
import { EntityManager } from 'typeorm';
import { RewardsService } from '../../src/application/rewards/rewardsService';
import { RewardsCalculator } from '../../src/domain/service/rewardsCalculator';
import { ITransactionClient } from '../../src/application/ports/ITransactionClient';
import { User } from '../../src/domain/entities/user';
import { Submission } from '../../src/domain/entities/submission';
import { RewardsDistributionData } from '../../src/domain/entities/rewardsDistributionData';
import {
  SubmissionType,
  TransactionStatus,
} from '../../src/domain/entities/enums';
import { SubmissionTier } from '../../src/domain/helpers/types';
import { SubmissionDomainService } from '../../src/domain/service/submissionDomainService';

describe('Leaderboard Integration Tests', () => {
  let rewardsService: RewardsService;
  let entityManager: EntityManager;
  let dataSource: ReturnType<typeof getTestDataSource>;
  let mockTransactionClient: jest.Mocked<ITransactionClient>;
  const testTournamentId = 1;

  beforeAll(async () => {
    await createTestDataSource();
    dataSource = getTestDataSource();
    entityManager = dataSource.createEntityManager();

    // Mock transaction client to return fixed tournament ID
    mockTransactionClient = {
      getTournamentId: jest.fn().mockResolvedValue(testTournamentId),
      distributeRewards: jest.fn(),
      headToNextTournament: jest.fn(),
    } as unknown as jest.Mocked<ITransactionClient>;

    const rewardsCalculator = new RewardsCalculator();
    rewardsService = new RewardsService(
      rewardsCalculator,
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

  const createUser = async (
    googleId: string,
    nickName: string,
  ): Promise<User> => {
    const user = new User();
    user.googleId = googleId;
    user.nickName = nickName;
    user.referralCode = googleId.slice(0, 8).toUpperCase();
    user.points = 0;
    user.streak = 0;
    return await entityManager.save(user);
  };

  const createSubmission = async (
    user: User,
    score: number,
    tournamentId: number,
    type: SubmissionType = SubmissionType.WeeklyContest,
  ): Promise<Submission> => {
    const submissionDomainService = new SubmissionDomainService();
    // Use a valid Stacks address (base32: A-Z, 2-7, exactly 41 chars)
    const validAddress = `ST2CY5V3NHDPWSXMWQDT3HC3GD6Q6XX4CFRKAG`
      .padEnd(41, 'A')
      .substring(0, 41);
    const submission = submissionDomainService.createSubmission(
      validAddress,
      score,
      tournamentId,
      type,
      user,
      false,
    );
    // Set transaction status to Success so it's included in leaderboard
    submission.transactionStatus = TransactionStatus.Success;
    return await entityManager.save(submission);
  };

  describe('getLeaderboard', () => {
    it('should return empty leaderboard when no submissions exist', async () => {
      const user = await createUser('user1', 'User1');

      const leaderboard = await rewardsService.getLeaderboard(user.id);

      expect(leaderboard.gold).toHaveLength(0);
      expect(leaderboard.silver).toHaveLength(0);
      expect(leaderboard.bronze).toHaveLength(0);
      expect(leaderboard.top).toHaveLength(0);
      expect(leaderboard.userPosition).toBeNull();
      expect(leaderboard.userSubmission).toBeNull();
    });

    it('should return correct leaderboard with user in gold tier', async () => {
      // Create multiple users with different scores
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');
      const user4 = await createUser('user4', 'User4');
      const user5 = await createUser('user5', 'User5');
      const user6 = await createUser('user6', 'User6');

      // Create submissions with scores (highest to lowest)
      // For 6 users, we expect: gold=1, silver=2, bronze=3 (based on RewardsCalculator logic)
      await createSubmission(user1, 1000, testTournamentId); // Should be gold
      await createSubmission(user2, 800, testTournamentId); // Should be silver
      await createSubmission(user3, 700, testTournamentId); // Should be silver
      await createSubmission(user4, 600, testTournamentId); // Should be bronze
      await createSubmission(user5, 500, testTournamentId); // Should be bronze
      await createSubmission(user6, 400, testTournamentId); // Should be bronze

      const leaderboard = await rewardsService.getLeaderboard(user1.id);

      // Verify tiers
      expect(leaderboard.gold.length).toBeGreaterThan(0);
      expect(leaderboard.silver.length).toBeGreaterThan(0);
      expect(leaderboard.bronze.length).toBeGreaterThan(0);

      // Verify user1 is in gold tier
      const user1InGold = leaderboard.gold.some(
        (sub) => sub.user.id === user1.id,
      );
      expect(user1InGold).toBe(true);

      // Verify user position is 1 (highest score)
      expect(leaderboard.userPosition).toBe(1);
      expect(leaderboard.userSubmission).toBeDefined();
      expect(leaderboard.userSubmission?.user.id).toBe(user1.id);
      expect(leaderboard.userSubmission?.score).toBe(1000);

      // Verify top field contains top 6 submissions (all of them in this case, since we have 6)
      expect(leaderboard.top).toHaveLength(6);
      expect(leaderboard.top[0].score).toBe(1000); // Highest score first
      expect(leaderboard.top[5].score).toBe(400); // Lowest score last
    });

    it('should return correct leaderboard with user in silver tier', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');
      const user4 = await createUser('user4', 'User4');

      await createSubmission(user1, 1000, testTournamentId);
      await createSubmission(user2, 800, testTournamentId); // This user
      await createSubmission(user3, 600, testTournamentId);
      await createSubmission(user4, 500, testTournamentId);

      const leaderboard = await rewardsService.getLeaderboard(user2.id);

      // Verify user2 is in silver tier
      const user2InSilver = leaderboard.silver.some(
        (sub) => sub.user.id === user2.id,
      );
      expect(user2InSilver).toBe(true);

      // Verify user position is 2
      expect(leaderboard.userPosition).toBe(2);
      expect(leaderboard.userSubmission?.score).toBe(800);
    });

    it('should return correct leaderboard with user in bronze tier', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');
      const user4 = await createUser('user4', 'User4');

      await createSubmission(user1, 1000, testTournamentId);
      await createSubmission(user2, 800, testTournamentId);
      await createSubmission(user3, 600, testTournamentId); // This user
      await createSubmission(user4, 500, testTournamentId);

      const leaderboard = await rewardsService.getLeaderboard(user3.id);

      // Verify user3 is in bronze tier
      const user3InBronze = leaderboard.bronze.some(
        (sub) => sub.user.id === user3.id,
      );
      expect(user3InBronze).toBe(true);

      // Verify user position is 3
      expect(leaderboard.userPosition).toBe(3);
      expect(leaderboard.userSubmission?.score).toBe(600);
    });

    it('should return null position when user has no submission', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3'); // No submission

      await createSubmission(user1, 1000, testTournamentId);
      await createSubmission(user2, 800, testTournamentId);

      const leaderboard = await rewardsService.getLeaderboard(user3.id);

      expect(leaderboard.userPosition).toBeNull();
      expect(leaderboard.userSubmission).toBeNull();
      // But leaderboard should still have data
      expect(
        leaderboard.gold.length +
          leaderboard.silver.length +
          leaderboard.bronze.length,
      ).toBeGreaterThan(0);
    });

    it('should only include WeeklyContest submissions, not Lottery', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');

      // Create WeeklyContest submission
      await createSubmission(
        user1,
        1000,
        testTournamentId,
        SubmissionType.WeeklyContest,
      );
      // Create Lottery submission (should be excluded)
      await createSubmission(
        user2,
        2000,
        testTournamentId,
        SubmissionType.Raffle,
      );

      const leaderboard = await rewardsService.getLeaderboard(user1.id);

      // Only user1 should be in leaderboard
      const allSubmissions = [
        ...leaderboard.gold,
        ...leaderboard.silver,
        ...leaderboard.bronze,
      ];
      const userIds = allSubmissions.map((sub) => sub.user.id);
      expect(userIds).toContain(user1.id);
      expect(userIds).not.toContain(user2.id);
    });

    it('should use best submission per user (highest score)', async () => {
      const user1 = await createUser('user1', 'User1');

      // Create multiple submissions for same user, different scores
      await createSubmission(user1, 500, testTournamentId);
      await createSubmission(user1, 1000, testTournamentId); // Best score
      await createSubmission(user1, 300, testTournamentId);

      const leaderboard = await rewardsService.getLeaderboard(user1.id);

      // Should use the highest score (1000)
      expect(leaderboard.userSubmission?.score).toBe(1000);
      expect(leaderboard.userPosition).toBe(1);
    });

    it('should correctly sort submissions by score descending', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');
      const user4 = await createUser('user4', 'User4');

      await createSubmission(user1, 1000, testTournamentId);
      await createSubmission(user2, 500, testTournamentId);
      await createSubmission(user3, 800, testTournamentId);
      await createSubmission(user4, 300, testTournamentId);

      const leaderboard = await rewardsService.getLeaderboard(user1.id);

      // All submissions should be sorted by score descending
      const allSubmissions = [
        ...leaderboard.gold,
        ...leaderboard.silver,
        ...leaderboard.bronze,
      ];

      for (let i = 0; i < allSubmissions.length - 1; i++) {
        expect(allSubmissions[i].score).toBeGreaterThanOrEqual(
          allSubmissions[i + 1].score,
        );
      }
    });

    it('should limit top field to 10 submissions', async () => {
      // Create 15 users with different scores
      const users = [];
      for (let i = 0; i < 15; i++) {
        const user = await createUser(`user${i}`, `User${i}`);
        users.push(user);
        await createSubmission(user, 1000 - i * 10, testTournamentId);
      }

      const leaderboard = await rewardsService.getLeaderboard(users[0].id);

      // Top field should be limited to 10 submissions
      expect(leaderboard.top).toHaveLength(10);
      expect(leaderboard.top[0].score).toBe(1000); // Highest score first
      expect(leaderboard.top[9].score).toBe(910); // 10th highest score
    });

    it('should handle large number of users correctly', async () => {
      // Create 20 users with different scores
      const users = [];
      for (let i = 0; i < 20; i++) {
        const user = await createUser(`user${i}`, `User${i}`);
        users.push(user);
        await createSubmission(user, 1000 - i * 10, testTournamentId);
      }

      const leaderboard = await rewardsService.getLeaderboard(users[0].id);

      // Verify leaderboard has data
      const totalSubmissions =
        leaderboard.gold.length +
        leaderboard.silver.length +
        leaderboard.bronze.length;
      expect(totalSubmissions).toBeGreaterThan(0);

      // Verify user position is 1 (highest score)
      expect(leaderboard.userPosition).toBe(1);
    });
  });

  describe('getPreviousTournament', () => {
    it('should return null when tournament data does not exist', async () => {
      const result = await rewardsService.getPreviousTournament(999);

      expect(result).toBeNull();
    });

    it('should return previous tournament data with correct tiers', async () => {
      // Create users and submissions
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');
      const user4 = await createUser('user4', 'User4');

      const sub1 = await createSubmission(user1, 1000, testTournamentId);
      const sub2 = await createSubmission(user2, 800, testTournamentId);
      const sub3 = await createSubmission(user3, 600, testTournamentId);
      const sub4 = await createSubmission(user4, 500, testTournamentId);

      // Set tiers manually (simulating distributeRewards)
      sub1.tier = SubmissionTier.Gold;
      sub2.tier = SubmissionTier.Silver;
      sub3.tier = SubmissionTier.Silver;
      sub4.tier = SubmissionTier.Bronze;
      await entityManager.save([sub1, sub2, sub3, sub4]);

      // Create RewardsDistributionData
      const rewardsData = new RewardsDistributionData();
      rewardsData.tournamentId = testTournamentId;
      rewardsData.transactionId = 'tx-123';
      rewardsData.rewardedSubmissions = [sub1, sub2, sub3, sub4];
      await entityManager.save(rewardsData);

      const result =
        await rewardsService.getPreviousTournament(testTournamentId);

      expect(result).not.toBeNull();
      expect(result!.gold).toHaveLength(1);
      expect(result!.silver).toHaveLength(2);
      expect(result!.bronze).toHaveLength(1);

      // Verify correct users in each tier
      expect(result!.gold[0].user.id).toBe(user1.id);
      expect(result!.silver.map((s) => s.user.id)).toContain(user2.id);
      expect(result!.silver.map((s) => s.user.id)).toContain(user3.id);
      expect(result!.bronze[0].user.id).toBe(user4.id);
    });

    it('should return submissions sorted by score within each tier', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');

      const sub1 = await createSubmission(user1, 1000, testTournamentId);
      const sub2 = await createSubmission(user2, 900, testTournamentId);
      const sub3 = await createSubmission(user3, 800, testTournamentId);

      // All in gold tier
      sub1.tier = SubmissionTier.Gold;
      sub2.tier = SubmissionTier.Gold;
      sub3.tier = SubmissionTier.Gold;
      await entityManager.save([sub1, sub2, sub3]);

      const rewardsData = new RewardsDistributionData();
      rewardsData.tournamentId = testTournamentId;
      rewardsData.transactionId = 'tx-123';
      rewardsData.rewardedSubmissions = [sub1, sub2, sub3];
      await entityManager.save(rewardsData);

      const result =
        await rewardsService.getPreviousTournament(testTournamentId);

      expect(result).not.toBeNull();
      expect(result!.gold).toHaveLength(3);

      // Verify sorted by score descending
      expect(result!.gold[0].score).toBe(1000);
      expect(result!.gold[1].score).toBe(900);
      expect(result!.gold[2].score).toBe(800);
    });

    it('should handle empty rewarded submissions', async () => {
      const rewardsData = new RewardsDistributionData();
      rewardsData.tournamentId = testTournamentId;
      rewardsData.transactionId = 'tx-123';
      rewardsData.rewardedSubmissions = [];
      await entityManager.save(rewardsData);

      const result =
        await rewardsService.getPreviousTournament(testTournamentId);

      expect(result).not.toBeNull();
      expect(result!.gold).toHaveLength(0);
      expect(result!.silver).toHaveLength(0);
      expect(result!.bronze).toHaveLength(0);
    });

    it('should only return submissions with tier set (Gold, Silver, Bronze)', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');

      const sub1 = await createSubmission(user1, 1000, testTournamentId);
      const sub2 = await createSubmission(user2, 800, testTournamentId);
      const sub3 = await createSubmission(user3, 600, testTournamentId);

      sub1.tier = SubmissionTier.Gold;
      sub2.tier = SubmissionTier.Silver;
      sub3.tier = SubmissionTier.None; // Should be excluded
      await entityManager.save([sub1, sub2, sub3]);

      const rewardsData = new RewardsDistributionData();
      rewardsData.tournamentId = testTournamentId;
      rewardsData.transactionId = 'tx-123';
      rewardsData.rewardedSubmissions = [sub1, sub2, sub3];
      await entityManager.save(rewardsData);

      const result =
        await rewardsService.getPreviousTournament(testTournamentId);

      expect(result).not.toBeNull();
      expect(result!.gold).toHaveLength(1);
      expect(result!.silver).toHaveLength(1);
      expect(result!.bronze).toHaveLength(0);

      // Verify sub3 (None tier) is not included
      const allSubmissions = [
        ...result!.gold,
        ...result!.silver,
        ...result!.bronze,
      ];
      const submissionIds = allSubmissions.map((s) => s.id);
      expect(submissionIds).toContain(sub1.id);
      expect(submissionIds).toContain(sub2.id);
      expect(submissionIds).not.toContain(sub3.id);
    });
  });
});
