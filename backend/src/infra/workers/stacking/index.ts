import { AppDataSource } from '../../db/dataSource';
import { stackingQueue } from '../queue';
import { StackingWorker } from './worker';
import { RedisCacheAdapter } from '../../redis/cacheAdapter';
import { logger } from '../../../api/helpers/logger';
import { ServiceFactory } from '../../../application/factory';

let worker: StackingWorker | null = null;
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
    await stackingQueue.close();

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
    const stackingService = factory.getStackingService();

    // Initialize reward folder ref (orchestrator method)
    logger.info('Initializing reward folder reference...');
    try {
      await stackingService.saveRewardFolderRef();
      logger.info('Reward folder reference initialized successfully');
    } catch (error) {
      logger.error({
        msg: 'Error initializing reward folder reference',
        err: error,
      });
      // Don't exit - allow worker to start, but jobs will fail if ref is not set
    }

    // Get existing repeatable jobs
    const repeatableJobs = await stackingQueue.getRepeatableJobs();

    // Remove any existing repeatable jobs for updateTxStatus
    for (const job of repeatableJobs) {
      if (job.name === 'updateTxStatus') {
        try {
          await stackingQueue.removeRepeatableByKey(
            `updateTxStatus::${job.pattern}`,
          );
          logger.info(
            `Removed existing updateTxStatus job with pattern: ${job.pattern}`,
          );
        } catch (error) {
          logger.debug({
            msg: 'Error removing repeatable job (may not exist)',
            err: error,
          });
        }
      }
    }

    // Remove any existing repeatable jobs for checkRewardRefAndUpdate
    for (const job of repeatableJobs) {
      if (job.name === 'checkRewardRefAndUpdate') {
        try {
          await stackingQueue.removeRepeatableByKey(
            `checkRewardRefAndUpdate::${job.pattern}`,
          );
          logger.info(
            `Removed existing checkRewardRefAndUpdate job with pattern: ${job.pattern}`,
          );
        } catch (error) {
          logger.debug({
            msg: 'Error removing repeatable job (may not exist)',
            err: error,
          });
        }
      }
    }

    // Schedule Job 1: Update transaction status every hour
    await stackingQueue.add(
      'updateTxStatus',
      {},
      {
        repeat: { every: 60 * 60 * 1000 }, // Every hour
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
    logger.info('Scheduled updateTxStatus job (every hour)');

    // Schedule Job 2: Check reward ref and update every 30 minutes
    await stackingQueue.add(
      'checkRewardRefAndUpdate',
      {},
      {
        repeat: { every: 30 * 60 * 1000 }, // Every 30 minutes
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
    logger.info('Scheduled checkRewardRefAndUpdate job (every 30 minutes)');

    // Initialize the worker
    worker = new StackingWorker(stackingService);
    logger.info('Stacking worker started successfully');
  })
  .catch((error) => {
    logger.error({
      msg: 'Error initializing stacking worker',
      err: error,
    });
    process.exit(1);
  });
