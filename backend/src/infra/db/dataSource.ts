import { DataSource } from 'typeorm';
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_TYPE,
  DB_USER,
  NODE_ENV,
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
import { DefiOperation } from '../../domain/entities/defiOperation';

export const AppDataSource = new DataSource({
  type: DB_TYPE,
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: NODE_ENV === 'production' ? false : true,
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
  ],
  subscribers: [],
  migrations: ['src/infra/db/migrations/**/*.ts'],
});
