import { configDotenv } from 'dotenv';
import { configParser } from './configParser';
import { DatabaseType } from './types';

configDotenv({ debug: false });

const isTest =
  process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'testing';

export const NODE_ENV: string = configParser('NODE_ENV', 'development');

export const JWT_SECRET: string = configParser(
  'JWT_SECRET',
  isTest ? 'test-jwt-secret-key-for-testing-only' : undefined,
);

export const PORT: number = parseInt(
  configParser('PORT', isTest ? '3000' : undefined),
);

export const DB_TYPE: DatabaseType = configParser(
  'DB_TYPE',
  isTest ? 'postgres' : undefined,
) as DatabaseType;

export const DB_HOST: string = configParser(
  'DB_HOST',
  isTest ? 'localhost' : undefined,
);

export const DB_USER: string = configParser(
  'DB_USER',
  isTest ? 'test_user' : undefined,
);

export const DB_PASSWORD: string = configParser(
  'DB_PASSWORD',
  isTest ? 'test_password' : undefined,
);

export const DB_NAME: string = configParser(
  'DB_NAME',
  isTest ? 'test_db' : undefined,
);

export const DB_PORT: number = parseInt(
  configParser('DB_PORT', isTest ? '5432' : undefined),
);

export const REFERRAL_BONUS: number = parseInt(
  configParser('REFERRAL_BONUS', isTest ? '100' : undefined),
);

export const STACKS_NETWORK: string = configParser('STACKS_NETWORK', 'testnet');

export const GAME_CONTRACT_ADDRESS: string = configParser(
  'GAME_CONTRACT_ADDRESS',
  isTest
    ? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.test-contract'
    : undefined,
);
export const SEND_REWARDS_CONTRACT_ADDRESS: string = configParser(
  'SEND_REWARDS_CONTRACT_ADDRESS',
  isTest
    ? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.test-contract'
    : undefined,
);
export const ADMIN_PRIVATE_KEY: string = configParser(
  'ADMIN_PRIVATE_KEY',
  isTest
    ? '0000000000000000000000000000000000000000000000000000000000000001'
    : undefined,
);

export const ADMIN_ADDRESS: string = configParser(
  'ADMIN_ADDRESS',
  isTest ? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' : undefined,
);

export const ADMIN_PUBLIC_KEY: string = configParser(
  'ADMIN_PUBLIC_KEY',
  isTest
    ? '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
    : undefined,
);

export const REDIS_HOST: string = configParser(
  'REDIS_HOST',
  isTest ? 'localhost' : undefined,
);

export const REDIS_PORT: number = parseInt(
  configParser('REDIS_PORT', isTest ? '6379' : undefined),
);

export const REDIS_PASSWORD: string = configParser(
  'REDIS_PASSWORD',
  isTest ? 'test_password' : undefined,
);

export const MAX_FRAUD_ATTEMPTS: number = 10;

export const SCORE_MULTIPLIER: number = 10;

export const SILVER_TIER_BONUS: number = 1000;

export const BRONZE_TIER_BONUS: number = 500;

export const GOLD_TIER_USTX_BONUS: number = 50000000;
