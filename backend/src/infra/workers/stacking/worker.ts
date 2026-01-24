import { Job, Worker } from 'bullmq';
import { StackingService } from '../../../application/stacking/stackingService';
import { redis } from '../../redis/redisClient';
import { logger } from '../../../api/helpers/logger';

export class StackingWorker {
  private worker: Worker;

  constructor(private stackingService: StackingService) {
    this.worker = new Worker('stacking', this.handleJob.bind(this), {
      connection: redis,
      concurrency: 1,
      lockDuration: 3600000, // 1 hour - max time a job can be locked
      maxStalledCount: 1,
    });
  }

  private async handleJob(job: Job) {
    try {
      logger.info(`Handling stacking job: ${job.name} (ID: ${job.id})`);

      switch (job.name) {
        case 'updateTxStatus': {
          await this.updateTxStatus();
          logger.info(`Job ${job.id}: Transaction status updated successfully`);
          break;
        }
        case 'checkRewardRefAndUpdate': {
          await this.checkRewardRefAndUpdate();
          logger.info(`Job ${job.id}: Reward ref check completed`);
          break;
        }
        default: {
          logger.error(`Unknown job name: ${job.name}`);
          throw new Error(`Unknown job name: ${job.name}`);
        }
      }
    } catch (error) {
      logger.error({
        msg: `Error handling stacking job ${job.name} (ID: ${job.id})`,
        err: error,
        jobId: job.id,
        jobName: job.name,
      });
      throw error;
    }
  }

  private async updateTxStatus() {
    logger.info(
      'Starting transaction status update for pending stacking delegations',
    );

    try {
      await this.stackingService.updatePendingStackingDelegations();
      logger.info('Transaction status update completed successfully');
    } catch (error) {
      logger.error({
        msg: 'Error updating transaction status',
        err: error,
      });
      throw error;
    }
  }

  private async checkRewardRefAndUpdate() {
    logger.info('Checking if reward folder ref has been updated');

    try {
      const hasChanged = await this.stackingService.rewardRefHasChanged();

      if (hasChanged) {
        logger.info('Reward folder ref has changed - updating reward data');
        await this.stackingService.updateRewardData();
        logger.info('Reward data updated successfully');
      } else {
        logger.info('Reward folder ref has not changed - skipping update');
      }
    } catch (error) {
      logger.error({
        msg: 'Error checking reward ref or updating rewards',
        err: error,
      });
      throw error;
    }
  }

  async close() {
    await this.worker.close();
  }
}
