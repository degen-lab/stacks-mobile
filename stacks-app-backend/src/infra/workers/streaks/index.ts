import { AppDataSource } from '../../db/dataSource';
import { streakQueue } from '../queue';
import { StreakWorker } from './worker';
import { RedisCacheAdapter } from '../../redis/cacheAdapter';
import { logger } from '../../../api/helpers/logger';
import { ServiceFactory } from '../../../application/factory';

let worker: StreakWorker | null = null;
let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress, forcing exit');
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    if (worker) {
      logger.info('Closing worker...');
      await worker.close();
    }

    logger.info('Closing queue...');
    await streakQueue.close();

    logger.info('Closing database connection...');
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({
      msg: 'Error during shutdown',
      err: error,
    });
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    msg: 'Unhandled Rejection',
    reason,
    promise,
  });
});

process.on('uncaughtException', (error) => {
  logger.error({
    msg: 'Uncaught Exception',
    err: error,
  });
  shutdown('uncaughtException');
});

AppDataSource.initialize()
  .then(async (dataSource) => {
    const factory: ServiceFactory = ServiceFactory.getInstance(
      dataSource,
      new RedisCacheAdapter(),
    );
    const streakService = factory.getStreakService();

    // Initialize daily streak challenge if it doesn't exist
    try {
      await streakService.getDailyStreak();
      logger.info('Daily streak challenge already exists in cache');
    } catch {
      logger.info('Daily streak challenge not found, initializing...');
      const newStreak = await streakService.setDailyStreak();
      logger.info(
        `Daily streak challenge initialized: ${newStreak.description}`,
      );
    }

    // Set up repeatable job for setDailyStreak
    // Remove any existing repeatable job first, then add the new one
    // The key format for BullMQ repeatable jobs is: {jobName}::{pattern}
    const repeatJobKey = 'setDailyStreak::0 0 * * *';
    try {
      // Remove existing repeatable job if it exists (no error if it doesn't exist)
      await streakQueue.removeRepeatableByKey(repeatJobKey);
      logger.info(
        'Removed existing repeatable job setDailyStreak (if it existed)',
      );
    } catch (error) {
      // Ignore errors when removing (job might not exist)
      logger.debug({
        msg: 'No existing repeatable job to remove (or error removing)',
        err: error,
      });
    }

    // Add the repeatable job
    try {
      await streakQueue.add(
        'setDailyStreak',
        {},
        {
          repeat: { pattern: '0 0 * * *' },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );
      logger.info('Repeatable job setDailyStreak scheduled');
    } catch (error) {
      logger.error({
        msg: 'Failed to schedule repeatable job setDailyStreak',
        err: error,
      });
      // Don't throw - allow worker to start even if job scheduling fails
      // The job can be manually added later if needed
    }

    worker = new StreakWorker(streakService);
    logger.info('Streak worker started successfully');
  })
  .catch((error) => {
    logger.error({
      msg: 'Error initializing streaks worker',
      err: error,
    });
    process.exit(1);
  });
