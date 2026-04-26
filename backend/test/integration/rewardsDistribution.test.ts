import {
  createTestDataSource,
  closeTestDataSource,
  cleanTestDatabase,
  getTestDataSource,
} from './testDataSource';
import { EntityManager } from 'typeorm';
import { RewardsService } from '../../src/application/rewards/rewardsService';
import { RewardsCalculator } from '../../src/domain/service/rewardsCalculator';
import { TransactionClientPort } from '../../src/application/ports/transactionClientPort';
import { User } from '../../src/domain/entities/user';
import { Submission } from '../../src/domain/entities/submission';
import { RewardsDistributionData } from '../../src/domain/entities/rewardsDistributionData';
import {
  SubmissionType,
  TransactionStatus,
} from '../../src/domain/entities/enums';
import { SubmissionTier } from '../../src/domain/helpers/types';
import { SubmissionDomainService } from '../../src/domain/service/submissionDomainService';
import {
  BRONZE_TIER_BONUS,
  GOLD_TIER_BONUS,
  SILVER_TIER_BONUS,
} from '../../src/shared/constants';

describe('Rewards Distribution Integration Tests', () => {
  let rewardsService: RewardsService;
  let entityManager: EntityManager;
  let dataSource: ReturnType<typeof getTestDataSource>;
  let mockTransactionClient: jest.Mocked<TransactionClientPort>;
  const testTournamentId = 1;

  // Valid Stacks address (41 chars, c32check)
  const validAddress = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7';

  beforeAll(async () => {
    await createTestDataSource();
    dataSource = getTestDataSource();
    entityManager = dataSource.createEntityManager();

    mockTransactionClient = {
      getTournamentId: jest.fn().mockResolvedValue(testTournamentId),
      distributeRewards: jest.fn().mockResolvedValue('tx-rewards-123'),
      headToNextTournament: jest.fn(),
      getTransactionStatus: jest.fn(),
    } as unknown as jest.Mocked<TransactionClientPort>;

    const rewardsCalculator = new RewardsCalculator();
    rewardsService = new RewardsService(
      rewardsCalculator,
      mockTransactionClient,
      entityManager,
    );
  });

  afterEach(async () => {
    await cleanTestDatabase();
    jest.clearAllMocks();
    if (mockTransactionClient) {
      mockTransactionClient.getTournamentId.mockResolvedValue(testTournamentId);
      mockTransactionClient.distributeRewards.mockResolvedValue(
        'tx-rewards-123',
      );
    }
  });

  afterAll(async () => {
    await closeTestDataSource();
  });

  const createUser = async (
    googleId: string,
    nickName: string,
    initialPoints = 0,
  ): Promise<User> => {
    const user = new User();
    user.googleId = googleId;
    user.nickName = nickName;
    user.referralCode = googleId.slice(0, 8).toUpperCase();
    user.points = initialPoints;
    user.streak = 0;
    return await entityManager.save(user);
  };

  const createSubmission = async (
    user: User,
    score: number,
    addressOverride?: string,
  ): Promise<Submission> => {
    const submissionDomainService = new SubmissionDomainService();
    const submission = submissionDomainService.createSubmission(
      addressOverride ?? validAddress,
      score,
      testTournamentId,
      SubmissionType.WeeklyContest,
      user,
      false,
    );
    submission.transactionStatus = TransactionStatus.Success;
    return await entityManager.save(submission);
  };

  describe('distributeRewards', () => {
    it('should assign correct tiers and award points across all winning tiers', async () => {
      // RewardsCalculator: 36 users -> rewardedUsersCount=9, gold=1, silver=3, bronze=5
      const users = await Promise.all(
        Array.from({ length: 36 }, (_, i) =>
          createUser(`user-${i}`, `User${i}`),
        ),
      );

      for (let i = 0; i < 36; i++) {
        await createSubmission(users[i], 1000 - i * 10);
      }

      await rewardsService.distributeRewards();

      // Reload users to get updated points
      const updatedUsers = await entityManager.find(User, {
        where: users.map((u) => ({ id: u.id })),
      });
      const userMap = new Map(updatedUsers.map((u) => [u.id, u]));

      // Reload submissions to get tiers
      const submissions = await entityManager.find(Submission, {
        where: { tournamentId: testTournamentId },
        relations: ['user'],
      });

      const gold = submissions.filter((s) => s.tier === SubmissionTier.Gold);
      const silver = submissions.filter(
        (s) => s.tier === SubmissionTier.Silver,
      );
      const bronze = submissions.filter(
        (s) => s.tier === SubmissionTier.Bronze,
      );

      expect(gold).toHaveLength(1);
      expect(silver).toHaveLength(3);
      expect(bronze).toHaveLength(5);

      for (const sub of gold) {
        const user = userMap.get(sub.user.id);
        expect(user?.points).toBe(GOLD_TIER_BONUS);
      }

      for (const sub of silver) {
        const user = userMap.get(sub.user.id);
        expect(user?.points).toBe(SILVER_TIER_BONUS);
      }

      for (const sub of bronze) {
        const user = userMap.get(sub.user.id);
        expect(user?.points).toBe(BRONZE_TIER_BONUS);
      }

      expect(mockTransactionClient.distributeRewards).not.toHaveBeenCalled();
    });

    it('should keep the on-chain distribution client disabled in the active path', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');

      await createSubmission(user1, 1000);
      await createSubmission(user2, 800);
      await createSubmission(user3, 600);

      await rewardsService.distributeRewards();

      expect(mockTransactionClient.distributeRewards).not.toHaveBeenCalled();
    });

    it('should save RewardsDistributionData with a points distribution reference', async () => {
      const user1 = await createUser('user1', 'User1');
      await createSubmission(user1, 1000);

      await rewardsService.distributeRewards();

      const rewardsData = await entityManager.find(RewardsDistributionData, {
        where: { tournamentId: testTournamentId },
        relations: ['rewardedSubmissions'],
      });

      expect(rewardsData).toHaveLength(1);
      expect(rewardsData[0].transactionId).toBe('points-distribution:weekly:1');
      expect(rewardsData[0].rewardedSubmissions).toHaveLength(1);
    });

    it('should use best submission per user (DISTINCT ON)', async () => {
      const user1 = await createUser('user1', 'User1');
      const user2 = await createUser('user2', 'User2');
      const user3 = await createUser('user3', 'User3');
      const user4 = await createUser('user4', 'User4');
      const user5 = await createUser('user5', 'User5');
      const user6 = await createUser('user6', 'User6');

      // User1: two submissions, best is 900
      await createSubmission(user1, 500);
      await createSubmission(user1, 900);

      await createSubmission(user2, 800);
      await createSubmission(user3, 700);
      await createSubmission(user4, 600);
      await createSubmission(user5, 500);
      await createSubmission(user6, 400);

      await rewardsService.distributeRewards();

      // 6 users -> rewardedUsersCount=3, gold=1, silver=1, bronze=1
      const submissions = await entityManager.find(Submission, {
        where: { tournamentId: testTournamentId },
        relations: ['user'],
      });

      const goldSub = submissions.find((s) => s.tier === SubmissionTier.Gold);
      const silverSub = submissions.find(
        (s) => s.tier === SubmissionTier.Silver,
      );
      const bronzeSub = submissions.find(
        (s) => s.tier === SubmissionTier.Bronze,
      );

      expect(goldSub?.score).toBe(900);
      expect(goldSub?.user.id).toBe(user1.id);
      expect(silverSub?.score).toBe(800);
      expect(silverSub?.user.id).toBe(user2.id);
      expect(bronzeSub?.score).toBe(700);
      expect(bronzeSub?.user.id).toBe(user3.id);
    });

    it('should not distribute when no successful submissions exist', async () => {
      const user = await createUser('user1', 'User1');
      const submission = await createSubmission(user, 1000);
      submission.transactionStatus = TransactionStatus.Pending;
      await entityManager.save(submission);

      await rewardsService.distributeRewards();

      expect(mockTransactionClient.distributeRewards).not.toHaveBeenCalled();

      const rewardsData = await entityManager.find(RewardsDistributionData);
      expect(rewardsData).toHaveLength(0);
    });

    it('treats points distribution references as completed without chain polling', async () => {
      const rewardsData = new RewardsDistributionData();
      rewardsData.tournamentId = testTournamentId;
      rewardsData.transactionId = 'points-distribution:weekly:1';
      rewardsData.rewardedSubmissions = [];
      await entityManager.save(rewardsData);

      const isCompleted =
        await rewardsService.isRewardsDistributionCompleted(testTournamentId);

      expect(isCompleted).toBe(true);
      expect(mockTransactionClient.getTransactionStatus).not.toHaveBeenCalled();
    });
  });
});
