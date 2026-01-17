import { DataSource } from 'typeorm';
import { UserService } from './user/userService';
import { UserDomainService } from '../domain/service/userDomainService';
import { GameSessionService } from '../domain/service/gameSessionService';
import { TransactionService } from './transaction/transactionService';
import { TransactionClient } from '../infra/stacks/transactionClient';
import { SubmissionDomainService } from '../domain/service/submissionDomainService';
import { StreakService } from './streaks/streakService';
import { StreaksDomainService } from '../domain/service/streaksDomainService';
import { GameStoreService } from './gameStore/gameStoreService';
import { GameStoreDomainService } from '../domain/service/gameStoreDomainService';
import { ICachePort } from './ports/ICachePort';
import { RewardsService } from './rewards/rewardsService';
import { RewardsCalculator } from '../domain/service/rewardsCalculator';
import { TransakPurchaseClient } from '../infra/purchase/transakPurchaseClient';
import { CryptoPurchaseService } from './purchase/cryptoPurchaseService';
import { CryptoPurchaseDomainService } from '../domain/service/cryptoPurchaseDomainService';
import { StackingService } from './stacking/stackingService';

type ServiceType =
  | UserService
  | TransactionService
  | StreakService
  | GameStoreService
  | RewardsService
  | CryptoPurchaseService
  | StackingService;

type ServiceConstructor<T extends ServiceType> = new (...args: unknown[]) => T;

export class ServiceFactory {
  private static instance: ServiceFactory;
  private cacheAdapter: ICachePort;
  private services: Map<ServiceConstructor<ServiceType> | string, ServiceType> =
    new Map();
  private dataSource: DataSource;

  private constructor(dataSource: DataSource, cacheAdapter: ICachePort) {
    this.dataSource = dataSource;
    this.services = new Map();
    this.cacheAdapter = cacheAdapter;
  }

  static getInstance(
    dataSource: DataSource,
    cacheAdapter: ICachePort,
  ): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(dataSource, cacheAdapter);
    }
    return ServiceFactory.instance;
  }

  getUserService(): UserService {
    if (!this.services.has('userService')) {
      this.services.set(
        'userService',
        new UserService(
          new UserDomainService(),
          this.getStreakService(),
          new GameSessionService(),
          new TransactionClient(),
          this.dataSource.createEntityManager(),
        ),
      );
    }
    return this.services.get('userService') as UserService;
  }

  getTransactionService(): TransactionService {
    if (!this.services.has('transactionService')) {
      this.services.set(
        'transactionService',
        new TransactionService(
          new TransactionClient(),
          new SubmissionDomainService(),
          this.dataSource.createEntityManager(),
        ),
      );
    }
    return this.services.get('transactionService') as TransactionService;
  }

  getStreakService(): StreakService {
    if (!this.services.has('streakService')) {
      this.services.set(
        'streakService',
        new StreakService(
          new StreaksDomainService(),
          this.cacheAdapter,
          this.dataSource.createEntityManager(),
        ),
      );
    }
    return this.services.get('streakService') as StreakService;
  }

  getGameStoreService(): GameStoreService {
    if (!this.services.has('gameStoreService')) {
      this.services.set(
        'gameStoreService',
        new GameStoreService(
          new GameStoreDomainService(),
          this.dataSource.createEntityManager(),
        ),
      );
    }
    return this.services.get('gameStoreService') as GameStoreService;
  }

  getRewardsService(): RewardsService {
    if (!this.services.has('rewardsService')) {
      this.services.set(
        'rewardsService',
        new RewardsService(
          new RewardsCalculator(),
          new TransactionClient(),
          this.dataSource.createEntityManager(),
        ),
      );
    }
    return this.services.get('rewardsService') as RewardsService;
  }

  getCryptoPurchaseService(): CryptoPurchaseService {
    if (!this.services.has('cryptoPurchaseService')) {
      this.services.set(
        'cryptoPurchaseService',
        new CryptoPurchaseService(
          this.dataSource.createEntityManager(),
          this.cacheAdapter,
          new TransakPurchaseClient(),
          new CryptoPurchaseDomainService(),
        ),
      );
    }
    return this.services.get('cryptoPurchaseService') as CryptoPurchaseService;
  }

  getStackingService(): StackingService {
    if (!this.services.has('stackingService')) {
      this.services.set(
        'stackingServices',
        new StackingService(
          this.dataSource.createEntityManager(),
          new TransactionClient(),
        ),
      );
    }
    return this.services.get('stackingService') as StackingService;
  }
}
