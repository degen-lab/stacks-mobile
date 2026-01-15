import { DataSource, EntityManager } from 'typeorm';
import {
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
} from '../../src/shared/constants';
import { User } from '../../src/domain/entities/user';
import { DefaultItem } from '../../src/domain/entities/defaultItem';
import { UniqueItem } from '../../src/domain/entities/uniqueItem';
import { ConsumableItem } from '../../src/domain/entities/consumableItem';
import { Submission } from '../../src/domain/entities/submission';
import { FraudAttempt } from '../../src/domain/entities/fraudAttempt';
import { RewardsDistributionData } from '../../src/domain/entities/rewardsDistributionData';
import { TournamentStatus } from '../../src/domain/entities/tournamentStatus';
import { CryptoPurchase } from '../../src/domain/entities/cryptoPurchase';

let testDataSource: DataSource | null = null;

export interface TestDataSourceOptions {
  dropSchema?: boolean;
  synchronize?: boolean;
  logging?: boolean;
}

/**
 * Creates and initializes a test DataSource for integration tests.
 * @param options Configuration options for the test DataSource
 * @returns Initialized DataSource instance
 */
export const createTestDataSource = async (
  options: TestDataSourceOptions = {},
): Promise<DataSource> => {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  const {
    dropSchema = true, // Default: drop schema for clean slate
    synchronize = true, // Default: auto-create schema
    logging = false, // Default: no logging in tests
  } = options;

  const dataSource = new DataSource({
    type: 'postgres',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    database: 'stacks_app_integration', // Hardcoded test database name
    synchronize,
    logging,
    dropSchema, // Drop schema on connection for clean slate
    entities: [
      User,
      DefaultItem,
      UniqueItem,
      ConsumableItem,
      Submission,
      FraudAttempt,
      RewardsDistributionData,
      TournamentStatus,
      CryptoPurchase,
    ],
  });

  await dataSource.initialize();
  testDataSource = dataSource;
  return dataSource;
};

/**
 * Gets the current test DataSource instance.
 * @throws Error if DataSource is not initialized
 * @returns Initialized DataSource instance
 */
export const getTestDataSource = (): DataSource => {
  if (!testDataSource || !testDataSource.isInitialized) {
    throw new Error(
      'Test DataSource not initialized. Call createTestDataSource() first.',
    );
  }
  return testDataSource;
};

/**
 * Closes and destroys the test DataSource connection.
 */
export const closeTestDataSource = async (): Promise<void> => {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
};

/**
 * Cleans all tables in the test database.
 * Useful for cleaning up between tests without dropping the schema.
 * Deletes in order to respect foreign key constraints.
 */
export const cleanTestDatabase = async (): Promise<void> => {
  // Only clean if dataSource is initialized
  if (!testDataSource || !testDataSource.isInitialized) {
    return;
  }
  const dataSource = getTestDataSource();
  const entityManager = dataSource.createEntityManager();

  // Use transaction to ensure atomic cleanup
  await entityManager.transaction(async (manager: EntityManager) => {
    // Delete all records from each table
    // Using query builder to delete all records (TypeORM doesn't allow empty criteria)
    // Order matters due to foreign key constraints
    await manager
      .createQueryBuilder()
      .delete()
      .from(RewardsDistributionData)
      .execute();
    await manager.createQueryBuilder().delete().from(FraudAttempt).execute();
    await manager.createQueryBuilder().delete().from(CryptoPurchase).execute();
    await manager.createQueryBuilder().delete().from(Submission).execute();
    await manager.createQueryBuilder().delete().from(ConsumableItem).execute();
    await manager.createQueryBuilder().delete().from(UniqueItem).execute();
    await manager.createQueryBuilder().delete().from(DefaultItem).execute();
    await manager.createQueryBuilder().delete().from(User).execute();
  });
};
