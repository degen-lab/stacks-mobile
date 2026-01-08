import { SubmissionsCleanupWorker } from './worker';
import { ServiceFactory } from '../../../application/factory';
import { RedisCacheAdapter } from '../../redis/cacheAdapter';
import { AppDataSource } from '../../db/dataSource';
import { logger } from '../../../api/helpers/logger';

const shutdown = async (signal: string, worker?: SubmissionsCleanupWorker) => {
  logger.info({
    msg: `Received ${signal}, shutting down submissions cleanup worker`,
  });
  if (worker) {
    await worker.close();
  }
  await AppDataSource.destroy();
  process.exit(0);
};

AppDataSource.initialize()
  .then(async (dataSource) => {
    const factory = ServiceFactory.getInstance(
      dataSource,
      new RedisCacheAdapter(),
    );
    const transactionService = factory.getTransactionService();
    const worker = new SubmissionsCleanupWorker(transactionService);

    process.on('SIGINT', () => shutdown('SIGINT', worker));
    process.on('SIGTERM', () => shutdown('SIGTERM', worker));
    process.on('uncaughtException', (error) => {
      logger.error({ msg: 'uncaughtException', err: error });
      shutdown('uncaughtException', worker);
    });
    process.on('unhandledRejection', (reason) => {
      logger.error({ msg: 'unhandledRejection', err: reason });
      shutdown('unhandledRejection', worker);
    });
  })
  .catch((err) => {
    logger.error({ msg: 'Error initializing submissions cleanup worker', err });
    process.exit(1);
  });
