import { ItemVariant } from '../domain/entities/enums';

export enum DatabaseType {
  postgres = 'postgres',
}

export type GameSession = {
  seed: string;
  signature: string;
  moves: Move[];
  usedItems: ItemVariant[];
};

export type MoveClientDebug = {
  stickTip: number | null;
  bridgeLength: number | null;
  currentPlatformRight: number | null;
  nextPlatformIndex: number | null;
  platformX: number | null;
  platformRight: number | null;
  platformCenter: number | null;
  platformIsMoving: boolean | null;
};

// in milliseconds
export type Move = {
  startTime: number; // the start time when the user pressed the screen to build the bridge
  duration: number; // the time the user held the screen to build the bridge
  idleDurationMs?: number; // optional idle time before press (ms)
  debug?: MoveClientDebug; // optional frontend-provided debug
};

export type DailyStreakChallenge = {
  id: number;
  description: string;
  validator: (sessionResult: SessionValidationResult) => boolean;
};

export enum FraudReason {
  NONE = 'NONE',
  INVALID_ITEM = 'INVALID_ITEM_USED',
  INVALID_DATA = 'INVALID_DATA',
  TOO_FAST_BRIDGE = 'TOO_FAST_BRIDGE',
  TOO_FAST_BETWEEN_MOVES = 'TOO_FAST_BETWEEN_MOVES',
  PERFECT_RATE_TOO_HIGH = 'PERFECT_RATE_TOO_HIGH',
  TOO_MANY_CONSECUTIVE_PERFECT = 'TOO_MANY_CONSECUTIVE_PERFECT',
  DURATION_VARIANCE_TOO_LOW = 'DURATION_VARIANCE_TOO_LOW',
  TIMING_VARIANCE_TOO_LOW = 'TIMING_VARIANCE_TOO_LOW',
  USER_BLACK_LISTED = 'USER_BLACK_LISTED',
}

export type SessionValidationResult = {
  timePlayed: number;
  score: number;
  blocksPassed: number;
  isFraud: boolean;
  fraudReason: FraudReason;
};

export type SessionValidationPlatformDebug = {
  index: number;
  x: number;
  w: number;
  right: number;
  isMoving: boolean;
  vx: number;
  minX: number;
  maxX: number;
  initialX: number;
  rng?: {
    gapRng?: number;
    widthRng?: number;
    moveChanceRng?: number;
    directionRng?: number;
    rangeRng?: number;
    patrolSeedRng?: number;
  };
};

export type SessionValidationMoveDebug = {
  moveIndex: number;
  originalIndex: number;
  startTime: number;
  duration: number;
  idleDurationMs: number;
  client?: MoveClientDebug;
  bridgeLength: number | null;
  currentPlatformIndex: number | null;
  currentPlatformRight: number | null;
  currentPlatformStoppedRight: number | null;
  currentPlatformBaseRight: number | null;
  nextPlatformIndex: number | null;
  platformInitialX: number | null;
  platformWidth: number | null;
  platformMinX: number | null;
  platformMaxX: number | null;
  platformIsMoving: boolean | null;
  platformXAtRelease: number | null;
  platformRightAtRelease: number | null;
  platformCenterAtRelease: number | null;
  platformXAtLanding: number | null;
  platformRightAtLanding: number | null;
  platformCenterAtLanding: number | null;
  stickTip: number | null;
  distToCenter: number | null;
  isPerfect: boolean | null;
  hit: boolean | null;
  pointsAwarded: number | null;
  gap: number | null;
  invalidReason?: string;
};

export type SessionValidationDebug = {
  seedNumber: number;
  seedHex: string;
  platforms: SessionValidationPlatformDebug[];
  moves: SessionValidationMoveDebug[];
  failure?: {
    reason: FraudReason;
    message: string;
    moveIndex?: number;
  };
  summary?: SessionValidationResult;
};

export enum TransakApiRoutes {
  REFRESH_ACCESS_TOKEN = 'partners/api/v2/refresh-token',
  CREATE_WIDGET_URL = 'api/v2/auth/session',
}

export type TransakAccessToken = {
  accessToken: string;
  expiresAt: number;
};

export enum AppPlatform {
  IOS,
  ANDROID,
}

export type StxTransactionData = {
  functionName: string;
  txStatus: string;
  // From smart contract log
  balance: number;
  burnchainUnlockHeight: number;
  locked: number;
  stacker: string;
  // From data tuple
  amountUstx: number;
  delegateTo: string;
  startCycleId: number;
  endCycleId: number | null;
  unlockBurnHeight: number | null;
  poxAddress: string | null;
};
