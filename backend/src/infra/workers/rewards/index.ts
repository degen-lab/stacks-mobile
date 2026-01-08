import { AppDataSource } from '../../db/dataSource';
import { rewardsQueue } from '../queue';
import { RewardsWorker } from './worker';
import { RedisCacheAdapter } from '../../redis/cacheAdapter';
import { logger } from '../../../api/helpers/logger';
import { ServiceFactory } from '../../../application/factory';

let worker: RewardsWorker | null = null;
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
    await rewardsQueue.close();

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
    // Check if repeatable job already exists to avoid duplicates
    const repeatableJobs = await rewardsQueue.getRepeatableJobs();
    const jobPattern = '0 0 */5 * *'; // Every 5 days at 00:00
    repeatableJobs.some(
      (job) =>
        job.name === 'processTournamentCycle' && job.pattern === jobPattern,
    );

    // Always remove any existing repeatable jobs with the same name (regardless of pattern)
    // This ensures we start fresh with the correct pattern
    for (const job of repeatableJobs) {
      if (job.name === 'processTournamentCycle') {
        try {
          await rewardsQueue.removeRepeatableByKey(
            `processTournamentCycle::${job.pattern}`,
          );
          logger.info(
            `Removed existing repeatable job with pattern: ${job.pattern}`,
          );
        } catch (error) {
          logger.debug({
            msg: 'Error removing repeatable job (may not exist)',
            err: error,
          });
        }
      }
    }

    // Always add the job with the correct pattern (we just removed all old ones)
    await rewardsQueue.add(
      'processTournamentCycle',
      {},
      {
        repeat: { pattern: jobPattern }, // Every 5 days at 00:00
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );
    logger.info(
      'Repeatable job processTournamentCycle scheduled (every 5 days at 00:00)',
    );

    const factory: ServiceFactory = ServiceFactory.getInstance(
      dataSource,
      new RedisCacheAdapter(),
    );
    const rewardsService = factory.getRewardsService();

    // Initialize tournament status if it doesn't exist
    try {
      const tournamentStatus =
        await rewardsService.getCurrentTournamentStatus();
      if (!tournamentStatus) {
        logger.info('Tournament status not found, initializing...');
        await rewardsService.createTournamentStatus();
        logger.info('Tournament status initialized successfully');
      } else {
        logger.info({
          msg: 'Tournament status already exists',
          tournamentId: tournamentStatus.tournamentId,
          status: tournamentStatus.status,
        });
      }
    } catch (error) {
      logger.error({
        msg: 'Error initializing tournament status',
        err: error,
      });
      // Don't exit - allow worker to start even if initialization fails
      // The worker will handle missing tournament status in its processing logic
    }

    worker = new RewardsWorker(rewardsService);
    logger.info('Rewards worker started successfully');
  })
  .catch((error) => {
    logger.error({
      msg: 'Error initializing rewards worker',
      err: error,
    });
    process.exit(1);
  });
