import { EntityManager } from 'typeorm';
import { StackingService } from '../../../src/application/stacking/stackingService';
import { TransactionClientPort } from '../../../src/application/ports/transactionClientPort';
import { StackingPoolClientPort } from '../../../src/application/ports/stackingPoolClientPort';
import { CachePort } from '../../../src/application/ports/cachePort';
import { StackingData } from '../../../src/domain/entities/stackingData';
import { User } from '../../../src/domain/entities/user';
import { TransactionStatus } from '../../../src/domain/entities/enums';
import {
  WrongStackingFunctionError,
  WrongStackingPoolError,
  RewardFolderRefNotCached,
} from '../../../src/application/errors/stackingDataErrors';
import { UserNotFoundError } from '../../../src/application/errors/userErrors';
import { FAST_POOL_STX_ADDRESS } from '../../../src/shared/constants';

describe('StackingService', () => {
  let stackingService: StackingService;
  let mockEntityManager: jest.Mocked<EntityManager>;
  let mockTransactionClient: jest.Mocked<TransactionClientPort>;
  let mockStackingPoolClient: jest.Mocked<StackingPoolClientPort>;
  let mockCacheClient: jest.Mocked<CachePort>;

  beforeEach(() => {
    mockEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      transaction: jest.fn((callback) => callback(mockEntityManager)),
    } as unknown as jest.Mocked<EntityManager>;

    mockTransactionClient = {
      fetchStackingTransactionData: jest.fn(),
      fetchPoxCycleData: jest.fn(),
      getTransactionStatus: jest.fn(),
    } as unknown as jest.Mocked<TransactionClientPort>;

    mockStackingPoolClient = {
      delegationTotalRewards: jest.fn(),
      getRewardFolderRef: jest.fn(),
    } as unknown as jest.Mocked<StackingPoolClientPort>;

    mockCacheClient = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<CachePort>;

    stackingService = new StackingService(
      mockEntityManager,
      mockTransactionClient,
      mockStackingPoolClient,
      mockCacheClient,
    );
  });

  describe('saveStackingData', () => {
    const mockUser: Partial<User> = {
      id: 1,
      googleId: 'google123',
      nickName: 'testuser',
      points: 0,
      streak: 0,
      referralCode: 'REF123',
      isBlackListed: false,
    };

    const mockTxData = {
      functionName: 'delegate-stx',
      delegateTo: FAST_POOL_STX_ADDRESS,
      startCycleId: 10,
      endCycleId: 20,
      stacker: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      poxAddress: 'bc1qtest',
      amountUstx: 1000000000,
      txStatus: 'pending',
      balance: 1000000000,
      burnchainUnlockHeight: 100000,
      locked: 0,
      unlockBurnHeight: null,
    };

    it('should save stacking data successfully', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser as User);
      mockTransactionClient.fetchStackingTransactionData.mockResolvedValue(
        mockTxData,
      );
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await stackingService.saveStackingData(
        1,
        'abc123',
        'FastPool',
      );

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: 1 },
      });
      expect(
        mockTransactionClient.fetchStackingTransactionData,
      ).toHaveBeenCalledWith('0xabc123');
      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(StackingData);
      expect(result.txId).toBe('0xabc123');
      expect(result.startCycleId).toBe(10);
      expect(result.endCycleId).toBe(20);
      expect(result.amountOfStxStacked).toBe(1000);
      expect(result.poolName).toBe('FastPool');
    });

    it('should add 0x prefix if not present', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser as User);
      mockTransactionClient.fetchStackingTransactionData.mockResolvedValue(
        mockTxData,
      );
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.saveStackingData(1, 'abc123', 'FastPool');

      expect(
        mockTransactionClient.fetchStackingTransactionData,
      ).toHaveBeenCalledWith('0xabc123');
    });

    it('should not add 0x prefix if already present', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser as User);
      mockTransactionClient.fetchStackingTransactionData.mockResolvedValue(
        mockTxData,
      );
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.saveStackingData(1, '0xabc123', 'FastPool');

      expect(
        mockTransactionClient.fetchStackingTransactionData,
      ).toHaveBeenCalledWith('0xabc123');
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(
        stackingService.saveStackingData(999, 'abc123', 'FastPool'),
      ).rejects.toThrow(UserNotFoundError);
      await expect(
        stackingService.saveStackingData(999, 'abc123', 'FastPool'),
      ).rejects.toThrow('User with id 999 not found');
    });

    it('should throw WrongStackingFunctionError if function is not delegate-stx', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser as User);
      mockTransactionClient.fetchStackingTransactionData.mockResolvedValue({
        ...mockTxData,
        functionName: 'revoke-delegate-stx',
      });

      await expect(
        stackingService.saveStackingData(1, 'abc123', 'FastPool'),
      ).rejects.toThrow(WrongStackingFunctionError);
    });

    it('should throw WrongStackingPoolError if wrong pool address', async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser as User);
      mockTransactionClient.fetchStackingTransactionData.mockResolvedValue({
        ...mockTxData,
        delegateTo: 'SPWRONGPOOL.wrong-pool',
      });

      await expect(
        stackingService.saveStackingData(1, 'abc123', 'FastPool'),
      ).rejects.toThrow(WrongStackingPoolError);
    });
  });

  describe('updateRewardData', () => {
    it('should update rewards for completed delegations', async () => {
      const mockDelegation: StackingData = {
        id: 1,
        userStxAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        startCycleId: 10,
        endCycleId: 15,
        txStatus: TransactionStatus.Success,
      } as StackingData;

      mockTransactionClient.fetchPoxCycleData.mockResolvedValue({
        cycleId: 20,
      });
      mockEntityManager.find.mockResolvedValueOnce([mockDelegation]);
      mockEntityManager.find.mockResolvedValueOnce([]); // Second iteration
      mockStackingPoolClient.delegationTotalRewards.mockResolvedValue(500000);
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.updateRewardData();

      expect(mockTransactionClient.fetchPoxCycleData).toHaveBeenCalled();
      expect(mockEntityManager.find).toHaveBeenCalledWith(StackingData, {
        where: expect.objectContaining({
          txStatus: TransactionStatus.Success,
        }),
        take: 100,
        skip: 0,
      });
      expect(
        mockStackingPoolClient.delegationTotalRewards,
      ).toHaveBeenCalledWith(
        'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        10,
        15,
      );
      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const mockDelegations = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        userStxAddress: `SPTEST${i}`,
        startCycleId: 10,
        endCycleId: 15,
        txStatus: TransactionStatus.Success,
      })) as StackingData[];

      mockTransactionClient.fetchPoxCycleData.mockResolvedValue({
        cycleId: 20,
      } as Awaited<ReturnType<TransactionClientPort['fetchPoxCycleData']>>);
      mockEntityManager.find.mockResolvedValueOnce(mockDelegations); // First batch
      mockEntityManager.find.mockResolvedValueOnce([]); // Second batch (empty)
      mockStackingPoolClient.delegationTotalRewards.mockResolvedValue(500000);
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.updateRewardData();

      expect(mockEntityManager.find).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.find).toHaveBeenNthCalledWith(
        1,
        StackingData,
        expect.objectContaining({ skip: 0 }),
      );
      expect(mockEntityManager.find).toHaveBeenNthCalledWith(
        2,
        StackingData,
        expect.objectContaining({ skip: 100 }),
      );
    });

    it('should handle delegations with null endCycleId', async () => {
      const mockDelegation: StackingData = {
        id: 1,
        userStxAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        startCycleId: 10,
        endCycleId: null,
        txStatus: TransactionStatus.Success,
      } as StackingData;

      mockTransactionClient.fetchPoxCycleData.mockResolvedValue({
        cycleId: 20,
      } as Awaited<ReturnType<TransactionClientPort['fetchPoxCycleData']>>);
      mockEntityManager.find.mockResolvedValueOnce([mockDelegation]);
      mockEntityManager.find.mockResolvedValueOnce([]);
      mockStackingPoolClient.delegationTotalRewards.mockResolvedValue(500000);
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.updateRewardData();

      expect(
        mockStackingPoolClient.delegationTotalRewards,
      ).toHaveBeenCalledWith(
        'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        10,
        null,
      );
    });
  });

  describe('saveRewardFolderRef', () => {
    it('should fetch and save reward folder ref', async () => {
      const mockSha = '26b1be73b32241ccde76b82920883ba047d0dbd2';
      mockStackingPoolClient.getRewardFolderRef.mockResolvedValue(mockSha);

      await stackingService.saveRewardFolderRef();

      expect(mockStackingPoolClient.getRewardFolderRef).toHaveBeenCalled();
      expect(mockCacheClient.set).toHaveBeenCalledWith('rewards_ref', mockSha);
    });
  });

  describe('rewardRefHasChanged', () => {
    it('should return true when ref has changed', async () => {
      const oldSha = 'abc123';
      const newSha = 'def456';

      mockCacheClient.get.mockResolvedValue(oldSha);
      mockStackingPoolClient.getRewardFolderRef.mockResolvedValue(newSha);

      const result = await stackingService.rewardRefHasChanged();

      expect(result).toBe(true);
      expect(mockCacheClient.set).toHaveBeenCalledWith('rewards_ref', newSha);
    });

    it('should return false when ref has not changed', async () => {
      const sameSha = 'abc123';

      mockCacheClient.get.mockResolvedValue(sameSha);
      mockStackingPoolClient.getRewardFolderRef.mockResolvedValue(sameSha);

      const result = await stackingService.rewardRefHasChanged();

      expect(result).toBe(false);
      expect(mockCacheClient.set).not.toHaveBeenCalled();
    });

    it('should throw RewardFolderRefNotCached if no cached ref exists', async () => {
      mockCacheClient.get.mockResolvedValue(null);

      await expect(stackingService.rewardRefHasChanged()).rejects.toThrow(
        RewardFolderRefNotCached,
      );
    });
  });

  describe('updatePendingStackingDelegations', () => {
    it('should update pending transactions to success', async () => {
      const mockDelegation: StackingData = {
        id: 1,
        txId: '0xabc123',
        txStatus: TransactionStatus.Pending,
      } as StackingData;

      mockEntityManager.find.mockResolvedValueOnce([mockDelegation]);
      mockEntityManager.find.mockResolvedValueOnce([]);
      mockTransactionClient.getTransactionStatus.mockResolvedValue('success');
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.updatePendingStackingDelegations();

      expect(mockEntityManager.find).toHaveBeenCalledWith(StackingData, {
        where: { txStatus: TransactionStatus.Pending },
        take: 100,
        skip: 0,
      });
      expect(mockTransactionClient.getTransactionStatus).toHaveBeenCalledWith(
        '0xabc123',
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          txStatus: TransactionStatus.Success,
        }),
      );
    });

    it('should update pending transactions to failed', async () => {
      const mockDelegation: StackingData = {
        id: 1,
        txId: '0xabc123',
        txStatus: TransactionStatus.Pending,
      } as StackingData;

      mockEntityManager.find.mockResolvedValueOnce([mockDelegation]);
      mockEntityManager.find.mockResolvedValueOnce([]);
      mockTransactionClient.getTransactionStatus.mockResolvedValue('failed');
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.updatePendingStackingDelegations();

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          txStatus: TransactionStatus.Failed,
        }),
      );
    });

    it('should keep status as pending if still pending', async () => {
      const mockDelegation: StackingData = {
        id: 1,
        txId: '0xabc123',
        txStatus: TransactionStatus.Pending,
      } as StackingData;

      mockEntityManager.find.mockResolvedValueOnce([mockDelegation]);
      mockEntityManager.find.mockResolvedValueOnce([]);
      mockTransactionClient.getTransactionStatus.mockResolvedValue('pending');
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.updatePendingStackingDelegations();

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          txStatus: TransactionStatus.Pending,
        }),
      );
    });

    it('should handle pagination correctly with multiple batches', async () => {
      const batch1 = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        txId: `0xabc${i}`,
        txStatus: TransactionStatus.Pending,
      })) as StackingData[];

      const batch2 = Array.from({ length: 50 }, (_, i) => ({
        id: i + 101,
        txId: `0xdef${i}`,
        txStatus: TransactionStatus.Pending,
      })) as StackingData[];

      mockEntityManager.find.mockResolvedValueOnce(batch1);
      mockEntityManager.find.mockResolvedValueOnce(batch2);
      mockEntityManager.find.mockResolvedValueOnce([]);
      mockTransactionClient.getTransactionStatus.mockResolvedValue('success');
      mockEntityManager.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      await stackingService.updatePendingStackingDelegations();

      expect(mockEntityManager.find).toHaveBeenCalledTimes(2);
      expect(mockTransactionClient.getTransactionStatus).toHaveBeenCalledTimes(
        150,
      );
      expect(mockEntityManager.save).toHaveBeenCalledTimes(150);
    });
  });
});
