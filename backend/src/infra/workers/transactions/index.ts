import { AppDataSource } from '../../db/dataSource';
import { TransactionWorker } from './worker';
import { RedisCacheAdapter } from '../../redis/cacheAdapter';
import { logger } from '../../../api/helpers/logger';
import { ServiceFactory } from '../../../application/factory';
import { submissionsCleanupQueue } from '../queue';

let worker: TransactionWorker | null = null;
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
      logger.info('Stopping worker...');
      await worker.stop();
    }

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
    const transactionService = factory.getTransactionService();
    worker = new TransactionWorker(transactionService);
    await worker.start();
    logger.info('Transaction worker started successfully');

    // Schedule submissions cleanup every 2 hours
    await submissionsCleanupQueue.add(
      'cleanupSubmissions',
      {},
      { repeat: { every: 2 * 60 * 60 * 1000 } },
    );
  })
  .catch((error) => {
    logger.error({
      msg: 'Error initializing transaction worker',
      err: error,
    });
    process.exit(1);
  });
