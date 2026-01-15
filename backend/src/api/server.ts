import { DataSource } from 'typeorm';
import { UserService } from '../application/user/userService';
import Fastify from 'fastify';
import fastifyRawBody from 'fastify-raw-body';
import fp from './config/jwt';
import rateLimit from '@fastify/rate-limit';
import { rateLimitOptions } from './config/rateLimitConfig';
import userRoutes from './user';
import transactionRoutes from './transaction';
import { TransactionService } from '../application/transaction/transactionService';
import gameSessionRoutes from './gameSession';
import { StreakService } from '../application/streaks/streakService';
import gameStoreRoutes from './gameStore';
import { GameStoreService } from '../application/gameStore/gameStoreService';
import { ServiceFactory } from '../application/factory';
import { ICachePort } from '../application/ports/ICachePort';
import { RedisCacheAdapter } from '../infra/redis/cacheAdapter';
import tournamentRoutes from './tournament';
import { RewardsService } from '../application/rewards/rewardsService';
import prometheusRoutes from './prometheus';
import adMobRoutes from './adMob';
import purchaseRoutes from './purchase';
import { CryptoPurchaseService } from '../application/purchase/cryptoPurchaseService';

export const buildServer = async (dataSource: DataSource) => {
  const app = Fastify();

  app.register(fastifyRawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  });

  app.register(fp);

  app.register(
    rateLimit,
    rateLimitOptions({
      max: 10,
      timeWindow: '60000',
      errorResponseBuilder: () => ({
        statusCode: 429,
        error: 'TooManyRequestError',
        message: 'Too many requests, please try again after 1 minute',
      }),
    }),
  );
  const cacheAdapter: ICachePort = new RedisCacheAdapter();
  const factory: ServiceFactory = ServiceFactory.getInstance(
    dataSource,
    cacheAdapter,
  );
  const userService: UserService = factory.getUserService();
  const transactionService: TransactionService =
    factory.getTransactionService();
  const streakService: StreakService = factory.getStreakService();
  const gameStoreService: GameStoreService = factory.getGameStoreService();
  const rewardsService: RewardsService = factory.getRewardsService();
  const cryptoPurchaseService: CryptoPurchaseService =
    factory.getCryptoPurchaseService();
  app.register(userRoutes, {
    userService,
    prefix: '/user',
  });

  app.register(transactionRoutes, {
    transactionService,
    prefix: '/transaction',
  });

  app.register(gameSessionRoutes, {
    userService,
    streakService,
    transactionService,
    prefix: '/session',
  });

  app.register(gameStoreRoutes, {
    gameStoreService,
    prefix: '/store',
  });

  app.register(tournamentRoutes, {
    rewardsService,
    prefix: '/tournament',
  });

  app.register(adMobRoutes, {
    transactionService,
    prefix: '/adMob',
  });
  app.register(prometheusRoutes);

  app.register(purchaseRoutes, {
    cryptoPurchaseService,
    prefix: '/purchase',
  });

  return app;
};
