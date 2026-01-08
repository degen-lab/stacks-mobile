import { Job, Worker } from 'bullmq';
import { StreakService } from '../../../application/streaks/streakService';
import { redis } from '../../redis/redisClient';
import { logger } from '../../../api/helpers/logger';
import { streakQueue } from '../queue';

export class StreakWorker {
  private worker: Worker;
  constructor(private streakService: StreakService) {
    this.worker = new Worker('streaks', this.handleJob.bind(this), {
      connection: redis,
      concurrency: 1,
      lockDuration: 300000, // 5 minutes - max time a job can be locked
      maxStalledCount: 1, // Max times a job can be stalled before failing
    });
  }

  private async handleJob(job: Job) {
    try {
      logger.info(`Handling job: ${job.name} (ID: ${job.id})`);
      switch (job.name) {
        case 'resetStreaks': {
          await this.streakService.resetUsersStreak();
          logger.info(`Job ${job.id}: The streak has been reset successfully`);
          break;
        }
        case 'setDailyStreak': {
          const newStreak = await this.streakService.setDailyStreak();
          logger.info(
            `Job ${job.id}: New Daily streak set ${newStreak.description}`,
          );

          // Chain resetStreaks job after setDailyStreak completes successfully
          await streakQueue.add(
            'resetStreaks',
            {},
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 2000,
              },
            },
          );
          logger.info(`Job ${job.id}: resetStreaks job added to queue`);
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
