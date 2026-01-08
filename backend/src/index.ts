import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppDataSource } from './infra/db/dataSource';
import { buildServer } from './api/server';
import { logger } from './api/helpers/logger';
import { PORT } from './shared/constants';
import { MetricsService } from './infra/monitoring/metricsService';

AppDataSource.initialize()
  .then(async (dataSource: DataSource) => {
    const server = await buildServer(dataSource);

    const metricsService = new MetricsService(dataSource.manager);
    await metricsService.refreshMetrics();

    server.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        logger.error({
          err,
        });
        process.exit(1);
      }
      logger.info(`Server is running on ${address}`);
    });
  })
  .catch((err) => {
    logger.error({
      msg: 'Error during Data source initialization',
      err,
    });
  });
