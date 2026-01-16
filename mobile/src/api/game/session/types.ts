import { FraudReason, ItemVariant } from "@/lib/enums";

/**
 * Move data captured during gameplay
 */
export type GameMove = {
  startTime: number; // milliseconds, when user pressed to build bridge
  duration: number; // milliseconds, how long bridge was built
  idleDurationMs: number; // milliseconds before press
  debug?: MoveClientDebug;
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
  distToCenter?: number | null;
};

/**
 * Complete game session data to submit
 */
export type GameSessionData = {
  seed: string;
  signature: string;
  moves: GameMove[];
  usedItems: ItemVariant[];
};

/**
 * Request body for submitting a game session
 */
export type SubmitGameSessionRequest = {
  sessionData: GameSessionData;
  debug?: boolean;
};

/**
 * Response from generate seed endpoint
 */
export type GenerateSeedResponse = {
  success: true;
  message: string;
  data: {
    seed: string;
    signature: string;
  };
};

/**
 * Response from submit/validate session endpoint
 */
export type SubmitGameSessionResponse = {
  success: true;
  message: string;
  data: {
    sessionScore: number;
    pointsEarned: number;
    totalPoints: number;
    isFraud: boolean;
    fraudReason: FraudReason | null;
    debug?: SessionValidationDebug;
  };
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
  };
};

export type SessionValidationMoveDebug = {
  moveIndex: number;
  originalIndex: number;
  startTime: number;
  duration: number;
  idleDurationMs: number;
  client?: MoveClientDebug;
  frozen?: boolean;
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
  summary?: {
    timePlayed: number;
    score: number;
    blocksPassed: number;
    isFraud: boolean;
    fraudReason: FraudReason;
  };
};

/**
 * Daily streak challenge data
 */
export type DailyStreakData = {
  description: string;
};

/**
 * Response from daily streak endpoint
 */
export type DailyStreakResponse = {
  success: true;
  message: string;
  data: DailyStreakData;
};
