import { RewardsService } from '../../../src/application/rewards/rewardsService';
import { RewardsCalculator } from '../../../src/domain/service/rewardsCalculator';
import { TransactionClientPort } from '../../../src/application/ports/transactionClient';
import {
  EntityManager,
  Connection,
  EntityMetadata,
  SelectQueryBuilder,
} from 'typeorm';
import { Submission } from '../../../src/domain/entities/submission';
import { User } from '../../../src/domain/entities/user';
import { RewardsDistributionData } from '../../../src/domain/entities/rewardsDistributionData';
import {
  SubmissionType,
  TransactionStatus,
} from '../../../src/domain/entities/enums';
import { SubmissionTier } from '../../../src/domain/helpers/types';
import {
  BRONZE_TIER_BONUS,
  SILVER_TIER_BONUS,
} from '../../../src/shared/constants';

describe('RewardsService application class Unit tests', () => {
  let rewardsService: RewardsService;
  let mockRewardsCalculator: jest.Mocked<RewardsCalculator>;
  let mockTransactionClient: jest.Mocked<TransactionClientPort>;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockConnection: jest.Mocked<Connection>;

  beforeEach(() => {
    mockRewardsCalculator = {
      computeThreshold: jest.fn(),
    } as unknown as jest.Mocked<RewardsCalculator>;

    mockTransactionClient = {
      getTournamentId: jest.fn(),
      distributeRewards: jest.fn(),
      headToNextTournament: jest.fn(),
      getTransactionStatus: jest.fn(),
    } as unknown as jest.Mocked<TransactionClientPort>;

    mockConnection = {
      getMetadata: jest.fn(),
    } as unknown as jest.Mocked<Connection>;

    mockEntityManager = {
      transaction: jest.fn(),
      connection: mockConnection,
      query: jest.fn(),
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    rewardsService = new RewardsService(
      mockRewardsCalculator,
      mockTransactionClient,
      mockEntityManager,
    );
  });

  const createUser = (id: number, points: number = 0): User => {
    const user = new User();
    user.id = id;
    user.points = points;
    user.googleId = `google-${id}`;
    user.nickName = `user-${id}`;
    user.referralCode = `REF${id}`;
    return user;
  };

  const createSubmission = (
    id: number,
    score: number,
    user: User,
    tier: SubmissionTier = SubmissionTier.None,
  ): Submission => {
    const submission = new Submission();
    submission.id = id;
    submission.score = score;
    submission.tournamentId = 1;
    submission.type = SubmissionType.WeeklyContest;
    submission.tier = tier;
    submission.transactionId = `tx-${id}`;
    submission.stacksAddress = `ST${'1'.repeat(39)}`;
    submission.user = user;
    return submission;
  };

  describe('distributeRewards', () => {
    it('should successfully distribute rewards for all tiers', async () => {
      const tournamentId = 1;
      const txId = 'transaction-123';
      const user1 = createUser(1, 100);
      const user2 = createUser(2, 200);
      const user3 = createUser(3, 300);
      const user4 = createUser(4, 400);

      const goldSubmission = createSubmission(1, 1000, user1);
      const silverSubmission = createSubmission(2, 800, user2);
      const bronzeSubmission = createSubmission(3, 600, user3);
      const bronzeSubmission2 = createSubmission(4, 500, user4);

      const mockMetadata = {
        findColumnWithPropertyName: jest.fn().mockReturnValue({
          databaseName: 'userId',
        }),
      } as unknown as EntityMetadata;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([
            goldSubmission,
            silverSubmission,
            bronzeSubmission,
            bronzeSubmission2,
          ]),
      } as unknown as SelectQueryBuilder<Submission>;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockConnection.getMetadata.mockReturnValue(mockMetadata);
      mockEntityManager.query.mockResolvedValue([
        { id: 1, userId: 1 },
        { id: 2, userId: 2 },
        { id: 3, userId: 3 },
        { id: 4, userId: 4 },
      ]);
      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRewardsCalculator.computeThreshold.mockReturnValue({
        gold: [goldSubmission],
        silver: [silverSubmission],
        bronze: [bronzeSubmission, bronzeSubmission2],
      });
      mockTransactionClient.distributeRewards.mockResolvedValue(txId);

      const mockManager = {
        connection: mockConnection,
        query: jest.fn().mockResolvedValue([
          { id: 1, userId: 1 },
          { id: 2, userId: 2 },
          { id: 3, userId: 3 },
          { id: 4, userId: 4 },
        ]),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return callback(mockManager as unknown as EntityManager);
        },
      );

      await rewardsService.distributeRewards();

      // Verify tournament ID was fetched
      expect(mockTransactionClient.getTournamentId).toHaveBeenCalledTimes(1);

      // Verify submissions were queried with correct filters
      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('DISTINCT ON'),
        [tournamentId, SubmissionType.WeeklyContest, TransactionStatus.Success],
      );

      // Verify computeThreshold was called
      expect(mockRewardsCalculator.computeThreshold).toHaveBeenCalledTimes(1);

      // Verify silver tier: points awarded and both submission and user saved
      expect(silverSubmission.user.points).toBe(200 + SILVER_TIER_BONUS);
      expect(silverSubmission.tier).toBe(SubmissionTier.Silver);
      expect(mockManager.save).toHaveBeenCalledWith(silverSubmission);
      expect(mockManager.save).toHaveBeenCalledWith(silverSubmission.user);

      // Verify bronze tier: points awarded and both submission and user saved
      expect(bronzeSubmission.user.points).toBe(300 + BRONZE_TIER_BONUS);
      expect(bronzeSubmission.tier).toBe(SubmissionTier.Bronze);
      expect(bronzeSubmission2.user.points).toBe(400 + BRONZE_TIER_BONUS);
      expect(bronzeSubmission2.tier).toBe(SubmissionTier.Bronze);

      // Verify gold tier: tier set and submission saved
      expect(goldSubmission.tier).toBe(SubmissionTier.Gold);
      expect(mockManager.save).toHaveBeenCalledWith(goldSubmission);

      // Verify blockchain transaction was called with correct addresses
      expect(mockTransactionClient.distributeRewards).toHaveBeenCalledWith([
        goldSubmission.stacksAddress,
      ]);

      // Verify RewardsDistributionData was saved
      const savedRewardsData = mockManager.save.mock.calls.find(
        (call) => call[0] instanceof RewardsDistributionData,
      )?.[0] as RewardsDistributionData;
      expect(savedRewardsData).toBeDefined();
      expect(savedRewardsData.tournamentId).toBe(tournamentId);
      expect(savedRewardsData.transactionId).toBe(txId);
      expect(savedRewardsData.rewardedSubmissions).toHaveLength(4);
    });

    it('should return early if no submissions found', async () => {
      const tournamentId = 1;
      const mockMetadata = {
        findColumnWithPropertyName: jest.fn().mockReturnValue({
          databaseName: 'userId',
        }),
      };

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockConnection.getMetadata.mockReturnValue(
        mockMetadata as unknown as EntityMetadata,
      );
      mockEntityManager.query.mockResolvedValue([]);

      const mockManager = {
        connection: mockConnection,
        query: jest.fn().mockResolvedValue([]),
      };

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return callback(mockManager as unknown as EntityManager);
        },
      );

      await rewardsService.distributeRewards();

      // Verify query was called
      expect(mockManager.query).toHaveBeenCalled();

      // Verify computeThreshold was NOT called
      expect(mockRewardsCalculator.computeThreshold).not.toHaveBeenCalled();

      // Verify distributeRewards was NOT called
      expect(mockTransactionClient.distributeRewards).not.toHaveBeenCalled();
    });

    it('should only process WeeklyContest submissions', async () => {
      const tournamentId = 1;
      const user1 = createUser(1);
      const user2 = createUser(2);

      const weeklySubmission = createSubmission(1, 1000, user1);
      const lotterySubmission = createSubmission(2, 500, user2);
      lotterySubmission.type = SubmissionType.Raffle;

      const mockMetadata = {
        findColumnWithPropertyName: jest.fn().mockReturnValue({
          databaseName: 'userId',
        }),
      } as unknown as EntityMetadata;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([weeklySubmission]),
      } as unknown as SelectQueryBuilder<Submission>;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockConnection.getMetadata.mockReturnValue(mockMetadata);
      mockEntityManager.query.mockResolvedValue([{ id: 1, userId: 1 }]);
      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRewardsCalculator.computeThreshold.mockReturnValue({
        gold: [weeklySubmission],
        silver: [],
        bronze: [],
      });
      mockTransactionClient.distributeRewards.mockResolvedValue('tx-123');

      const mockManager = {
        connection: mockConnection,
        query: jest.fn().mockResolvedValue([{ id: 1, userId: 1 }]),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return callback(mockManager as unknown as EntityManager);
        },
      );

      await rewardsService.distributeRewards();

      // Verify query was called with WeeklyContest filter
      expect(mockManager.query).toHaveBeenCalledWith(
        expect.stringContaining('type'),
        [tournamentId, SubmissionType.WeeklyContest, TransactionStatus.Success],
      );

      // Verify queryBuilder also filters by WeeklyContest
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'submission.type = :type',
        { type: SubmissionType.WeeklyContest },
      );

      // Verify only weekly submission was processed
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(mockRewardsCalculator.computeThreshold).toHaveBeenCalledWith([
        weeklySubmission,
      ]);
    });

    it('should handle multiple gold tier submissions', async () => {
      const tournamentId = 1;
      const user1 = createUser(1);
      const user2 = createUser(2);
      const user3 = createUser(3);

      const gold1 = createSubmission(1, 1000, user1);
      gold1.stacksAddress = 'ST111111111111111111111111111111111111111';
      const gold2 = createSubmission(2, 950, user2);
      gold2.stacksAddress = 'ST222222222222222222222222222222222222222';
      const silver1 = createSubmission(3, 800, user3);

      const mockMetadata = {
        findColumnWithPropertyName: jest.fn().mockReturnValue({
          databaseName: 'userId',
        }),
      } as unknown as EntityMetadata;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([gold1, gold2, silver1]),
      } as unknown as SelectQueryBuilder<Submission>;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockConnection.getMetadata.mockReturnValue(mockMetadata);
      mockEntityManager.query.mockResolvedValue([
        { id: 1, userId: 1 },
        { id: 2, userId: 2 },
        { id: 3, userId: 3 },
      ]);
      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRewardsCalculator.computeThreshold.mockReturnValue({
        gold: [gold1, gold2],
        silver: [silver1],
        bronze: [],
      });
      mockTransactionClient.distributeRewards.mockResolvedValue('tx-123');

      const mockManager = {
        connection: mockConnection,
        query: jest.fn().mockResolvedValue([
          { id: 1, userId: 1 },
          { id: 2, userId: 2 },
          { id: 3, userId: 3 },
        ]),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return callback(mockManager as unknown as EntityManager);
        },
      );

      await rewardsService.distributeRewards();

      // Verify both gold submissions were saved
      expect(mockManager.save).toHaveBeenCalledWith(gold1);
      expect(mockManager.save).toHaveBeenCalledWith(gold2);

      // Verify distributeRewards was called with both addresses
      expect(mockTransactionClient.distributeRewards).toHaveBeenCalledWith([
        gold1.stacksAddress,
        gold2.stacksAddress,
      ]);
    });

    it('should correctly save RewardsDistributionData with all rewarded submissions', async () => {
      const tournamentId = 1;
      const txId = 'tx-456';
      const user1 = createUser(1);
      const user2 = createUser(2);
      const user3 = createUser(3);

      const gold = createSubmission(1, 1000, user1);
      const silver = createSubmission(2, 800, user2);
      const bronze = createSubmission(3, 600, user3);

      const mockMetadata = {
        findColumnWithPropertyName: jest.fn().mockReturnValue({
          databaseName: 'userId',
        }),
      } as unknown as EntityMetadata;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([gold, silver, bronze]),
      } as unknown as SelectQueryBuilder<Submission>;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockConnection.getMetadata.mockReturnValue(mockMetadata);
      mockEntityManager.query.mockResolvedValue([
        { id: 1, userId: 1 },
        { id: 2, userId: 2 },
        { id: 3, userId: 3 },
      ]);
      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRewardsCalculator.computeThreshold.mockReturnValue({
        gold: [gold],
        silver: [silver],
        bronze: [bronze],
      });
      mockTransactionClient.distributeRewards.mockResolvedValue(txId);

      const mockManager = {
        connection: mockConnection,
        query: jest.fn().mockResolvedValue([
          { id: 1, userId: 1 },
          { id: 2, userId: 2 },
          { id: 3, userId: 3 },
        ]),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return callback(mockManager as unknown as EntityManager);
        },
      );

      await rewardsService.distributeRewards();

      // Find the RewardsDistributionData that was saved
      const rewardsDataCalls = mockManager.save.mock.calls.filter(
        (call) => call[0] instanceof RewardsDistributionData,
      );
      expect(rewardsDataCalls).toHaveLength(1);

      const rewardsData = rewardsDataCalls[0][0] as RewardsDistributionData;
      expect(rewardsData.tournamentId).toBe(tournamentId);
      expect(rewardsData.transactionId).toBe(txId);
      expect(rewardsData.rewardedSubmissions).toHaveLength(3);
      expect(rewardsData.rewardedSubmissions).toContain(gold);
      expect(rewardsData.rewardedSubmissions).toContain(silver);
      expect(rewardsData.rewardedSubmissions).toContain(bronze);
    });

    it('should ensure user relation is loaded with submissions', async () => {
      const tournamentId = 1;
      const user1 = createUser(1);
      const submission = createSubmission(1, 1000, user1);

      const mockMetadata = {
        findColumnWithPropertyName: jest.fn().mockReturnValue({
          databaseName: 'userId',
        }),
      } as unknown as EntityMetadata;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([submission]),
      } as unknown as SelectQueryBuilder<Submission>;

      mockTransactionClient.getTournamentId.mockResolvedValue(tournamentId);
      mockConnection.getMetadata.mockReturnValue(mockMetadata);
      mockEntityManager.query.mockResolvedValue([{ id: 1, userId: 1 }]);
      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRewardsCalculator.computeThreshold.mockReturnValue({
        gold: [submission],
        silver: [],
        bronze: [],
      });
      mockTransactionClient.distributeRewards.mockResolvedValue('tx-123');

      const mockManager = {
        connection: mockConnection,
        query: jest.fn().mockResolvedValue([{ id: 1, userId: 1 }]),
        createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
        save: jest.fn().mockImplementation(async (entity) => entity),
      };

      (mockEntityManager.transaction as jest.Mock).mockImplementation(
        async (callback: (manager: EntityManager) => Promise<void>) => {
          return callback(mockManager as unknown as EntityManager);
        },
      );

      await rewardsService.distributeRewards();

      // Verify leftJoinAndSelect was called to load user relation
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'submission.user',
        'user',
      );
    });
  });

  describe('headToNextTournament', () => {
    it('should call transaction client to head to next tournament', async () => {
      const txId = 'next-tournament-tx-123';
      mockTransactionClient.headToNextTournament.mockResolvedValue(txId);

      await rewardsService.headToNextTournament();

      expect(mockTransactionClient.headToNextTournament).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should propagate errors from transaction client', async () => {
      const error = new Error('Transaction failed');
      mockTransactionClient.headToNextTournament.mockRejectedValue(error);

      await expect(rewardsService.headToNextTournament()).rejects.toThrow(
        'Transaction failed',
      );
    });
  });
});
