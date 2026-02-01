import { Job } from 'bullmq';
import { StackingWorker } from '../../../src/infra/workers/stacking/worker';
import { StackingService } from '../../../src/application/stacking/stackingService';

// Mock the logger
jest.mock('../../../src/api/helpers/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock BullMQ Worker
jest.mock('bullmq', () => {
  return {
    Worker: jest.fn().mockImplementation(() => {
      return {
        close: jest.fn().mockResolvedValue(undefined),
      };
    }),
    Job: jest.fn(),
  };
});

// Mock redis client
jest.mock('../../../src/infra/redis/redisClient', () => ({
  redis: {},
}));

describe('StackingWorker', () => {
  let stackingWorker: StackingWorker;
  let mockStackingService: jest.Mocked<StackingService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStackingService = {
      updatePendingStackingDelegations: jest.fn(),
      rewardRefHasChanged: jest.fn(),
      updateRewardData: jest.fn(),
      saveStackingData: jest.fn(),
      saveRewardFolderRef: jest.fn(),
    } as unknown as jest.Mocked<StackingService>;

    stackingWorker = new StackingWorker(mockStackingService);
  });

  describe('updateTxStatus job', () => {
    it('should call updatePendingStackingDelegations', async () => {
      mockStackingService.updatePendingStackingDelegations.mockResolvedValue(
        undefined,
      );

      const mockJob = {
        id: '123',
        name: 'updateTxStatus',
        data: {},
      } as Job;

      // Access the private handleJob method through the worker instance
      await (
        stackingWorker as unknown as { handleJob: (job: Job) => Promise<void> }
      ).handleJob(mockJob);

      expect(
        mockStackingService.updatePendingStackingDelegations,
      ).toHaveBeenCalledTimes(1);
    });

    it('should throw error if updatePendingStackingDelegations fails', async () => {
      const error = new Error('Database connection failed');
      mockStackingService.updatePendingStackingDelegations.mockRejectedValue(
        error,
      );

      const mockJob = {
        id: '123',
        name: 'updateTxStatus',
        data: {},
      } as Job;

      await expect(
        (
          stackingWorker as unknown as {
            handleJob: (job: Job) => Promise<void>;
          }
        ).handleJob(mockJob),
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('checkRewardRefAndUpdate job', () => {
    it('should update reward data when ref has changed', async () => {
      mockStackingService.rewardRefHasChanged.mockResolvedValue(true);
      mockStackingService.updateRewardData.mockResolvedValue(undefined);

      const mockJob = {
        id: '456',
        name: 'checkRewardRefAndUpdate',
        data: {},
      } as Job;

      await (
        stackingWorker as unknown as { handleJob: (job: Job) => Promise<void> }
      ).handleJob(mockJob);

      expect(mockStackingService.rewardRefHasChanged).toHaveBeenCalledTimes(1);
      expect(mockStackingService.updateRewardData).toHaveBeenCalledTimes(1);
    });

    it('should not update reward data when ref has not changed', async () => {
      mockStackingService.rewardRefHasChanged.mockResolvedValue(false);

      const mockJob = {
        id: '456',
        name: 'checkRewardRefAndUpdate',
        data: {},
      } as Job;

      await (
        stackingWorker as unknown as { handleJob: (job: Job) => Promise<void> }
      ).handleJob(mockJob);

      expect(mockStackingService.rewardRefHasChanged).toHaveBeenCalledTimes(1);
      expect(mockStackingService.updateRewardData).not.toHaveBeenCalled();
    });

    it('should throw error if rewardRefHasChanged fails', async () => {
      const error = new Error('Cache connection failed');
      mockStackingService.rewardRefHasChanged.mockRejectedValue(error);

      const mockJob = {
        id: '456',
        name: 'checkRewardRefAndUpdate',
        data: {},
      } as Job;

      await expect(
        (
          stackingWorker as unknown as {
            handleJob: (job: Job) => Promise<void>;
          }
        ).handleJob(mockJob),
      ).rejects.toThrow('Cache connection failed');
      expect(mockStackingService.updateRewardData).not.toHaveBeenCalled();
    });

    it('should throw error if updateRewardData fails', async () => {
      mockStackingService.rewardRefHasChanged.mockResolvedValue(true);
      const error = new Error('GitHub API failed');
      mockStackingService.updateRewardData.mockRejectedValue(error);

      const mockJob = {
        id: '456',
        name: 'checkRewardRefAndUpdate',
        data: {},
      } as Job;

      await expect(
        (
          stackingWorker as unknown as {
            handleJob: (job: Job) => Promise<void>;
          }
        ).handleJob(mockJob),
      ).rejects.toThrow('GitHub API failed');
    });
  });

  describe('unknown job', () => {
    it('should throw error for unknown job name', async () => {
      const mockJob = {
        id: '789',
        name: 'unknownJob',
        data: {},
      } as Job;

      await expect(
        (
          stackingWorker as unknown as {
            handleJob: (job: Job) => Promise<void>;
          }
        ).handleJob(mockJob),
      ).rejects.toThrow('Unknown job name: unknownJob');
    });
  });

  describe('close', () => {
    it('should close the worker', async () => {
      const mockClose = jest.fn().mockResolvedValue(undefined);
      (
        stackingWorker as unknown as { worker: { close: () => Promise<void> } }
      ).worker = { close: mockClose };

      await stackingWorker.close();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});
