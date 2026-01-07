import { Job, Worker } from 'bullmq';
import { redis } from '../../redis/redisClient';
import { logger } from '../../../api/helpers/logger';
import { TransactionService } from '../../../application/transaction/transactionService';

export class SubmissionsCleanupWorker {
  private worker: Worker;

  constructor(private transactionService: TransactionService) {
    this.worker = new Worker('submissions-cleanup', this.handleJob.bind(this), {
      connection: redis,
      concurrency: 1,
      lockDuration: 600000, // 10 minutes
      maxStalledCount: 1,
    });
  }

  private async handleJob(job: Job) {
    try {
      logger.info(`Handling job: ${job.name} (ID: ${job.id})`);
      switch (job.name) {
        case 'cleanupSubmissions': {
          await this.transactionService.cleanUpUnsuccessfullSubmissions();
          logger.info(`Job ${job.id}: Submissions cleanup completed`);
          break;
        }
        default: {
          logger.error(`Unknown job name: ${job.name}`);
          throw new Error(`Unknown job name: ${job.name}`);
        }
      }
    } catch (error) {
      logger.error({
        msg: `Error handling job ${job.name} (ID: ${job.id})`,
        err: error,
        jobId: job.id,
        jobName: job.name,
      });
      throw error;
    }
  }

  async close() {
    await this.worker.close();
  }
}
