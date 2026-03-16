import { join } from 'node:path';
import { DataSource } from 'typeorm';
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_TYPE,
  DB_USER,
} from '../../shared/constants';
import { User } from '../../domain/entities/user';
import { DefaultItem } from '../../domain/entities/defaultItem';
import { UniqueItem } from '../../domain/entities/uniqueItem';
import { ConsumableItem } from '../../domain/entities/consumableItem';
import { Submission } from '../../domain/entities/submission';
import { FraudAttempt } from '../../domain/entities/fraudAttempt';
import { RewardsDistributionData } from '../../domain/entities/rewardsDistributionData';
import { TournamentStatus } from '../../domain/entities/tournamentStatus';
import { CryptoPurchase } from '../../domain/entities/cryptoPurchase';
import { StackingData } from '../../domain/entities/stackingData';
import { SponsoredTransaction } from '../../domain/entities/sponsoredTransaction';
import { DefiOperation } from '../../domain/entities/defiOperation';

const shouldSynchronize =
  process.env.DB_SYNCHRONIZE === 'true' || process.env.NODE_ENV === 'test';

export const AppDataSource = new DataSource({
  type: DB_TYPE,
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  // Keep schema mutations out of worker startup unless explicitly requested.
  synchronize: shouldSynchronize,
  migrationsRun: !shouldSynchronize,
  logging: process.env.DB_LOGGING === 'true', // Only log SQL if explicitly enabled
  entities: [
    User,
    DefaultItem,
    UniqueItem,
    ConsumableItem,
    Submission,
    FraudAttempt,
    RewardsDistributionData,
    TournamentStatus,
    StackingData,
    CryptoPurchase,
    DefiOperation,
    SponsoredTransaction,
  ],
  subscribers: [],
  migrations: [join(__dirname, 'migrations/**/*.{ts,js}')],
});
