import crypto from 'crypto';
import { logger } from '../../api/helpers/logger';
import { SCORE_MULTIPLIER } from '../../shared/constants';
import {
  DailyStreakChallenge,
  FraudReason,
  GameSession,
  SessionValidationDebug,
  SessionValidationMoveDebug,
  SessionValidationResult,
} from '../../shared/types';
import { ConsumableItem } from '../entities/consumableItem';
import { ItemType, ItemVariant } from '../entities/enums';
import { User } from '../entities/user';
import { InvalidSeedError } from '../errors/sessionError';

// Game engine constants (must match frontend engine.ts)
const BRIDGE_CONFIG = {
  GROW_SPEED: 320, // pixels per second (reduced by 20% for slower gameplay)
  ROTATE_SPEED: 192, // degrees per second
  PERFECT_TOLERANCE: 3, // pixels
  HERO_SIZE: 40, // pixels
  HERO_PLATFORM_INSET: 6, // pixels
  HERO_MIN_LANDING_DISTANCE: 16, // pixels
  PLATFORM_MIN_GAP: 40, // pixels
  PLATFORM_MAX_GAP: 180, // pixels
  PLATFORM_MIN_WIDTH: 50, // pixels
  PLATFORM_MAX_WIDTH: 100, // pixels
  PLATFORM_START_WIDTH: 80, // pixels
  MAX_BRIDGE_LENGTH: 800, // pixels (80% of typical screen width)
  PLATFORM_SHRINK_START_INDEX: 15,
  PLATFORM_SHRINK_EVERY: 5,
  PLATFORM_SHRINK_FACTOR: 0.9,
  PLATFORM_MIN_WIDTH_EARLY: 40,
  PLATFORM_MIN_WIDTH_LATE: 25,
  PLATFORM_MIN_WIDTH_LATE_INDEX: 15,
  PLATFORM_MOVE_START_INDEX: 10,
  PLATFORM_MOVE_VELOCITY: 70, // pixels per second
  PLATFORM_MOVE_CHANCE: 0.4, // 40% chance to move
  PLATFORM_MOVE_MIN_RANGE: 80, // pixels
  PLATFORM_MOVE_MAX_RANGE: 180, // pixels
  PLATFORM_SPEED_START_INDEX: 10,
  PLATFORM_SPEED_EVERY: 10,
  PLATFORM_SPEED_INCREMENT: 0.03,
  PLATFORM_VARIANCE_START_INDEX: 15,
  PLATFORM_SPEED_VARIANCE_MIN: 0.98,
  PLATFORM_SPEED_VARIANCE_MAX: 1.02,
  PLATFORM_TARGET_MIN_DISTANCE: 70,
  PLATFORM_TARGET_MIN_DISTANCE_RATIO: 0.6,
  // Fraud detection thresholds
  MIN_BRIDGE_DURATION: 50, // milliseconds - minimum human reaction time
  MAX_PERFECT_RATE: 0.85, // 85% - if more than this, suspicious
  MIN_TIME_BETWEEN_MOVES: 100, // milliseconds - minimum time between moves
  MAX_CONSECUTIVE_PERFECT: 10, // maximum consecutive perfect landings
  MIN_VARIANCE_IN_DURATION: 20, // minimum variance in bridge durations (ms)
};

interface Platform {
  x: number; // Base x position (initial position)
  w: number;
  index: number;
  center: number;
  right: number;
  isMoving: boolean;
  vx: number; // Velocity (pixels per second)
  minX: number; // Movement bounds
  maxX: number;
  initialX: number; // Store initial position for movement calculation
  baseSpeed: number;
  patrolSeed: number;
}

export class GameSessionService {
  validateSession(
    user: User,
    session: GameSession,
    streakChallenge: DailyStreakChallenge,
    secret: string,
  ): {
    score: number;
    streakChallengeCompleted: boolean;
    blocksPassed: number;
    isFraud: boolean;
    fraudReason: FraudReason;
  } {
    const results = this.analyzeSession(user, session, secret);
    const streakChallengeCompleted = streakChallenge.validator(results);
    return {
      score: results.score,
      streakChallengeCompleted,
      blocksPassed: results.blocksPassed,
      isFraud: results.isFraud,
      fraudReason: results.fraudReason,
    };
  }

  validateSessionWithDebug(
    user: User,
    session: GameSession,
    streakChallenge: DailyStreakChallenge,
    secret: string,
  ): {
    score: number;
    streakChallengeCompleted: boolean;
    blocksPassed: number;
    isFraud: boolean;
    fraudReason: FraudReason;
    debug: SessionValidationDebug;
  } {
    const debug: SessionValidationDebug = {
      seedNumber: 0,
      seedHex: session.seed,
      platforms: [],
      moves: [],
    };
    const results = this.analyzeSession(user, session, secret, debug);
    debug.summary = results;
    const streakChallengeCompleted = streakChallenge.validator(results);
    return {
      score: results.score,
      streakChallengeCompleted,
      blocksPassed: results.blocksPassed,
      isFraud: results.isFraud,
      fraudReason: results.fraudReason,
      debug,
    };
  }

  private analyzeSession(
    user: User,
    session: GameSession,
    secret: string,
    debug?: SessionValidationDebug,
  ): SessionValidationResult {
    const fail = (
      fraudReason: FraudReason,
      message: string,
      moveIndex?: number,
    ): SessionValidationResult => {
      if (debug) {
        debug.failure = { reason: fraudReason, message, moveIndex };
      }
      return {
        timePlayed: 0,
        score: 0,
        blocksPassed: 0,
        isFraud: false,
        fraudReason,
      };
    };

    logger.info({
      msg: 'Validating game session',
      userId: user.id,
      movesCount: session.moves?.length || 0,
      seed: session.seed.substring(0, 16) + '...',
    });

    if (!this.verifySeed(session.seed, session.signature, secret)) {
      throw new InvalidSeedError('Invalid seed signature');
    }
    const itemUsageCount = new Map<ItemVariant, number>();
    for (const usedItem of session.usedItems) {
      const count = itemUsageCount.get(usedItem) || 0;
      itemUsageCount.set(usedItem, count + 1);
    }

    // Check if user has enough quantity for each item type
    for (const [variant, usageCount] of itemUsageCount.entries()) {
      const item = user.items.find(
        (ownedItem) =>
          ownedItem.type === ItemType.PowerUp &&
          (ownedItem.metadata as { variant?: ItemVariant } | undefined)
            ?.variant === variant,
      ) as ConsumableItem | undefined;

      // Item not found
      if (!item) {
        return fail(FraudReason.INVALID_ITEM, 'INVALID_ITEM: Missing item');
      }

      // Check if item is a consumable (has quantity property)
      if (!('quantity' in item) || typeof item.quantity !== 'number') {
        return fail(FraudReason.INVALID_ITEM, 'INVALID_ITEM: Not consumable');
      }

      // Check if user has enough quantity
      if (item.quantity < usageCount) {
        return fail(
          FraudReason.INVALID_ITEM,
          'INVALID_ITEM: Insufficient quantity',
        );
      }

      // Consume the items (decrease quantity)
      for (let i = 0; i < usageCount; i++) {
        item.consume();
      }
    }

    // Validate moves array
    if (!session.moves || session.moves.length === 0) {
      logger.warn({
        msg: 'INVALID_DATA: Empty moves array',
        userId: user.id,
      });
      return fail(FraudReason.INVALID_DATA, 'INVALID_DATA: Empty moves array');
    }

    // Parse seed from hex to number
    const seedNumber = this.parseSeedToNumber(session.seed);
    if (debug) {
      debug.seedNumber = seedNumber;
    }
    logger.info({
      msg: 'RNG seed parsed',
      userId: user.id,
      seedHex: session.seed.substring(0, 16) + '...',
      seedNumber,
      seedNumberHex: seedNumber.toString(16),
    });
    const rng = this.createRng(seedNumber);

    // Generate platform sequence (RNG must be called in exact same order as frontend)
    const platforms = this.generatePlatformSequence(
      rng,
      session.moves.length,
      debug?.platforms,
    );

    logger.info({
      msg: 'Platforms generated',
      userId: user.id,
      totalPlatforms: platforms.length,
      expectedMoves: session.moves.length,
      platformDetails: platforms.slice(0, 5).map((p) => ({
        index: p.index,
        x: Math.round(p.x * 100) / 100,
        width: Math.round(p.w * 100) / 100,
        right: Math.round(p.right * 100) / 100,
        isMoving: p.isMoving,
      })),
    });

    // Replay moves and validate
    let score = 0;
    let blocksPassed = 0;
    let totalTimePlayed = 0;
    let isFraud = false;
    let currentPlatformIndex = 0;
    let hasValidMoves = false;
    // Track where each platform stopped after landing (for moving platforms)
    // For platform 0 (fixed), this is always the base position
    let currentPlatformStoppedRight = platforms[0].right;

    // Fraud detection metrics
    let perfectLandings = 0;
    let successfulLandings = 0;
    let consecutivePerfect = 0;
    let maxConsecutivePerfect = 0;
    const bridgeDurations: number[] = [];
    const timeBetweenMoves: number[] = [];

    // Sort moves by startTime to ensure chronological order
    const sortedMoves = [...session.moves]
      .map((move, originalIndex) => ({ ...move, originalIndex }))
      .sort((a, b) => a.startTime - b.startTime);

    for (let i = 0; i < sortedMoves.length; i++) {
      const move = sortedMoves[i];
      const prevMove = i > 0 ? sortedMoves[i - 1] : null;
      const idleDurationMs = move.idleDurationMs ?? move.startTime;
      const moveDebug: SessionValidationMoveDebug | null = debug
        ? {
            moveIndex: i,
            originalIndex: move.originalIndex,
            startTime: move.startTime,
            duration: move.duration,
            idleDurationMs,
            client: move.debug,
            bridgeLength: null,
            currentPlatformIndex: null,
            currentPlatformRight: null,
            currentPlatformStoppedRight: null,
            currentPlatformBaseRight: null,
            nextPlatformIndex: null,
            platformInitialX: null,
            platformWidth: null,
            platformMinX: null,
            platformMaxX: null,
            platformIsMoving: null,
            platformXAtRelease: null,
            platformRightAtRelease: null,
            platformCenterAtRelease: null,
            platformXAtLanding: null,
            platformRightAtLanding: null,
            platformCenterAtLanding: null,
            stickTip: null,
            distToCenter: null,
            isPerfect: null,
            hit: null,
            pointsAwarded: null,
            gap: null,
          }
        : null;

      // Data validation - if data is invalid, return 0 score and fraud false
      if (move.startTime < 0 || move.duration < 0) {
        logger.warn({
          msg: 'INVALID_DATA: Negative startTime or duration',
          userId: user.id,
          moveIndex: i,
          startTime: move.startTime,
          duration: move.duration,
        });
        if (moveDebug) {
          moveDebug.invalidReason =
            'INVALID_DATA: Negative startTime or duration';
          debug?.moves.push(moveDebug);
        }
        return fail(
          FraudReason.INVALID_DATA,
          'INVALID_DATA: Negative startTime or duration',
          i,
        );
      }

      // Data validation - if moves overlap, data is invalid
      if (prevMove) {
        if (move.startTime < prevMove.startTime + prevMove.duration) {
          logger.warn({
            msg: 'INVALID_DATA: Overlapping moves',
            userId: user.id,
            moveIndex: i,
            prevMoveEnd: prevMove.startTime + prevMove.duration,
            currentMoveStart: move.startTime,
          });
          if (moveDebug) {
            moveDebug.invalidReason = 'INVALID_DATA: Overlapping moves';
            debug?.moves.push(moveDebug);
          }
          return fail(
            FraudReason.INVALID_DATA,
            'INVALID_DATA: Overlapping moves',
            i,
          );
        }
      }

      const pressDurationMs = this.getPressDurationMs(move.duration);

      // Track bridge durations for variance analysis
      bridgeDurations.push(pressDurationMs);
      hasValidMoves = true;
      totalTimePlayed = Math.max(
        totalTimePlayed,
        move.startTime + move.duration,
      );

      // Track time between moves for fraud detection
      if (prevMove) {
        const timeBetween =
          move.startTime - (prevMove.startTime + prevMove.duration);
        timeBetweenMoves.push(timeBetween);
      }

      // Calculate bridge length from press duration (input hold time)
      const bridgeLength = this.calculateBridgeLength(pressDurationMs);

      // Check if we have enough platforms - if not, data is invalid
      if (currentPlatformIndex + 1 >= platforms.length) {
        logger.warn({
          msg: 'INVALID_DATA: Not enough platforms',
          userId: user.id,
          moveIndex: i,
          currentPlatformIndex,
          totalPlatforms: platforms.length,
          totalMoves: sortedMoves.length,
        });
        if (moveDebug) {
          moveDebug.invalidReason = 'INVALID_DATA: Not enough platforms';
          debug?.moves.push(moveDebug);
        }
        return fail(
          FraudReason.INVALID_DATA,
          'INVALID_DATA: Not enough platforms',
          i,
        );
      }

      const currentPlatform = platforms[currentPlatformIndex];
      const nextPlatform = platforms[currentPlatformIndex + 1];

      logger.debug({
        msg: 'Processing move',
        userId: user.id,
        moveIndex: i,
        moveNumber: i + 1,
        currentPlatformIndex,
        currentPlatform: {
          index: currentPlatform.index,
          x: Math.round(currentPlatform.x * 100) / 100,
          right: Math.round(currentPlatform.right * 100) / 100,
        },
        nextPlatform: {
          index: nextPlatform.index,
          x: Math.round(nextPlatform.x * 100) / 100,
          right: Math.round(nextPlatform.right * 100) / 100,
          isMoving: nextPlatform.isMoving,
        },
      });

      const platformXAtRelease = this.calculatePlatformPositionAtTime(
        nextPlatform,
        idleDurationMs,
        move.duration,
      );

      const platformRightAtRelease = platformXAtRelease + nextPlatform.w;
      const platformCenterAtRelease = platformXAtRelease + nextPlatform.w / 2;

      const currentPlatformRight = currentPlatformStoppedRight;

      const stickTip = currentPlatformRight + bridgeLength;
      const hit =
        stickTip >= platformXAtRelease && stickTip <= platformRightAtRelease;

      logger.debug({
        msg: 'Hit detection calculation',
        userId: user.id,
        moveIndex: i,
        moveNumber: i + 1,
        currentPlatformRight: Math.round(currentPlatform.right * 100) / 100,
        bridgeLength: Math.round(bridgeLength * 100) / 100,
        stickTip: Math.round(stickTip * 100) / 100,
        platformXAtRelease: Math.round(platformXAtRelease * 100) / 100,
        platformRightAtRelease: Math.round(platformRightAtRelease * 100) / 100,
        platformInitialX: Math.round(nextPlatform.initialX * 100) / 100,
        platformIsMoving: nextPlatform.isMoving,
        hit,
        gap: Math.round((platformXAtRelease - stickTip) * 100) / 100,
      });

      if (moveDebug) {
        moveDebug.bridgeLength = bridgeLength;
        moveDebug.currentPlatformIndex = currentPlatformIndex;
        moveDebug.currentPlatformRight = currentPlatformRight;
        moveDebug.currentPlatformStoppedRight = currentPlatformStoppedRight;
        moveDebug.currentPlatformBaseRight = currentPlatform.right;
        moveDebug.nextPlatformIndex = nextPlatform.index;
        moveDebug.platformInitialX = nextPlatform.initialX;
        moveDebug.platformWidth = nextPlatform.w;
        moveDebug.platformMinX = nextPlatform.minX;
        moveDebug.platformMaxX = nextPlatform.maxX;
        moveDebug.platformIsMoving = nextPlatform.isMoving;
        moveDebug.platformXAtRelease = platformXAtRelease;
        moveDebug.platformRightAtRelease = platformRightAtRelease;
        moveDebug.platformCenterAtRelease = platformCenterAtRelease;
        moveDebug.stickTip = stickTip;
        moveDebug.hit = hit;
        moveDebug.gap = platformXAtRelease - stickTip;
      }

      if (hit) {
        const distToCenter = Math.abs(stickTip - platformCenterAtRelease);
        const isPerfect = distToCenter <= BRIDGE_CONFIG.PERFECT_TOLERANCE;
        const points = isPerfect ? 3 : 1;

        logger.debug({
          msg: 'Move successful',
          userId: user.id,
          moveIndex: i,
          hit: true,
          landed: true,
          isPerfect,
          points,
          distToCenter: Math.round(distToCenter * 100) / 100,
          bridgeLength: Math.round(bridgeLength * 100) / 100,
          stickTip: Math.round(stickTip * 100) / 100,
          platformX: Math.round(platformXAtRelease * 100) / 100,
          platformRight: Math.round(platformRightAtRelease * 100) / 100,
        });

        // Track perfect landings for fraud detection
        successfulLandings++;
        if (isPerfect) {
          perfectLandings++;
          consecutivePerfect++;
          maxConsecutivePerfect = Math.max(
            maxConsecutivePerfect,
            consecutivePerfect,
          );
        } else {
          consecutivePerfect = 0;
        }

        score += points;
        blocksPassed++;
        currentPlatformIndex++;
        currentPlatformStoppedRight = platformRightAtRelease;

        if (moveDebug) {
          moveDebug.distToCenter = distToCenter;
          moveDebug.isPerfect = isPerfect;
          moveDebug.pointsAwarded = points;
        }

        if (moveDebug) {
          moveDebug.distToCenter = distToCenter;
          moveDebug.isPerfect = isPerfect;
          moveDebug.pointsAwarded = points;
        }
      } else {
        logger.info({
          msg: 'Move missed platform',
          userId: user.id,
          moveIndex: i,
          moveNumber: i + 1,
          totalMoves: sortedMoves.length,
          hit: false,
          stickTip: Math.round(stickTip * 100) / 100,
          platformX: Math.round(platformXAtRelease * 100) / 100,
          platformRight: Math.round(platformRightAtRelease * 100) / 100,
          bridgeLength: Math.round(bridgeLength * 100) / 100,
          currentPlatformRight: Math.round(currentPlatform.right * 100) / 100,
          gap: Math.round((platformXAtRelease - stickTip) * 100) / 100,
        });

            x: platformXAtRelease,
        if (moveDebug) {
          moveDebug.distToCenter = null;
          moveDebug.isPerfect = null;
          moveDebug.pointsAwarded = 0;
        }
      }

      if (moveDebug) {
        debug?.moves.push(moveDebug);
      }
    }

    // If no valid moves were processed, return 0 score
    if (!hasValidMoves) {
      logger.warn({
        msg: 'INVALID_DATA: No valid moves processed',
        userId: user.id,
        totalMoves: sortedMoves.length,
      });
      return fail(
        FraudReason.INVALID_DATA,
        'INVALID_DATA: No valid moves processed',
      );
    }

    // Fraud detection checks - only for bot-like behavior
    let fraudReason: FraudReason = FraudReason.NONE;

    // Check variance in bridge durations (bots tend to be too consistent)
    if (bridgeDurations.length >= 3) {
      // Check for too fast bridges (bot-like reaction time)
      const tooFastBridges = bridgeDurations.filter(
        (d) => d < BRIDGE_CONFIG.MIN_BRIDGE_DURATION,
      ).length;
      if (tooFastBridges > 0) {
        isFraud = true;
        fraudReason = FraudReason.TOO_FAST_BRIDGE;
      }

      // Check variance (too consistent = bot)
      if (!isFraud) {
        const avgDuration =
          bridgeDurations.reduce((a, b) => a + b, 0) / bridgeDurations.length;
        const variance =
          bridgeDurations.reduce(
            (sum, d) => sum + Math.pow(d - avgDuration, 2),
            0,
          ) / bridgeDurations.length;
        const stdDev = Math.sqrt(variance);

        const scaledMinVariance = Math.max(
          10,
          BRIDGE_CONFIG.MIN_VARIANCE_IN_DURATION /
            Math.sqrt(bridgeDurations.length),
        );

        // If standard deviation is too low, durations are too consistent (bot-like)
        if (stdDev < scaledMinVariance) {
          isFraud = true;
          fraudReason = FraudReason.DURATION_VARIANCE_TOO_LOW;
        }
      }
    }

    if (!isFraud && timeBetweenMoves.length >= 3) {
      const tooFastMoves = timeBetweenMoves.filter(
        (t) => t < BRIDGE_CONFIG.MIN_TIME_BETWEEN_MOVES,
      ).length;
      if (tooFastMoves > 0) {
        isFraud = true;
        fraudReason = FraudReason.TOO_FAST_BETWEEN_MOVES;
      }

      if (!isFraud) {
        const avgTimeBetween =
          timeBetweenMoves.reduce((a, b) => a + b, 0) / timeBetweenMoves.length;
        const variance =
          timeBetweenMoves.reduce(
            (sum, t) => sum + Math.pow(t - avgTimeBetween, 2),
            0,
          ) / timeBetweenMoves.length;
        const stdDev = Math.sqrt(variance);

        const scaledMinVariance = Math.max(
          10,
          BRIDGE_CONFIG.MIN_VARIANCE_IN_DURATION /
            Math.sqrt(timeBetweenMoves.length),
        );

        if (stdDev < scaledMinVariance) {
          isFraud = true;
          fraudReason = FraudReason.TIMING_VARIANCE_TOO_LOW;
        }
      }
    }

    if (!isFraud && successfulLandings > 0) {
      const perfectRate = perfectLandings / successfulLandings;
      const threshold =
        sortedMoves.length >= 20
          ? 0.9 // More lenient for longer sessions (sliding window approximation)
          : BRIDGE_CONFIG.MAX_PERFECT_RATE; // Original threshold for short sessions
      if (perfectRate > threshold) {
        isFraud = true;
        fraudReason = FraudReason.PERFECT_RATE_TOO_HIGH;
      }

      // Check for too many consecutive perfect landings
      if (
        !isFraud &&
        maxConsecutivePerfect > BRIDGE_CONFIG.MAX_CONSECUTIVE_PERFECT
      ) {
        isFraud = true;
        fraudReason = FraudReason.TOO_MANY_CONSECUTIVE_PERFECT;
      }
    }

    const finalScore = score * SCORE_MULTIPLIER;

    logger.info({
      msg: 'Session validation complete',
      userId: user.id,
      score: finalScore,
      blocksPassed,
      isFraud,
      fraudReason,
      totalMoves: sortedMoves.length,
      timePlayed: totalTimePlayed,
    });

    return {
      timePlayed: totalTimePlayed,
      score: finalScore,
      blocksPassed,
      isFraud,
      fraudReason,
    };
  }
  async generateRandomSignedSeed(
    secret: string,
  ): Promise<{ seed: string; signature: string }> {
    const seed = crypto.randomBytes(32).toString('hex');
    const signature = this.signSeed(seed, secret);
    return { seed, signature };
  }

  signSeed(seed: string, secret: string): string {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(seed)
      .digest('hex');
    return signature;
  }

  public verifySeed(seed: string, signature: string, secret: string): boolean {
    const expectedSignature = this.signSeed(seed, secret);
    return signature === expectedSignature;
  }

  private createRng(seed: number) {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  private parseSeedToNumber(seedHex: string): number {
    // Parse hex seed to number (using first 32 bits to avoid precision loss)
    // Normalize seed: remove 0x prefix if present (matches frontend behavior)
    const normalized = seedHex.startsWith('0x') ? seedHex.slice(2) : seedHex;
    const seedBigInt = BigInt('0x' + normalized);
    // Take lower 32 bits to match engine's seed >>> 0 behavior
    return Number(seedBigInt & BigInt(0xffffffff));
  }

  private randomRange(rng: () => number, min: number, max: number): number {
    return min + rng() * (max - min);
  }

  private generatePlatformSequence(
    rng: () => number,
    numMoves: number,
    debugPlatforms?: SessionValidationDebug['platforms'],
  ): Platform[] {
    const platforms: Platform[] = [];

    // First platform (fixed, matches engine - cannot move)
    const firstPlatform: Platform = {
      x: 0,
      w: BRIDGE_CONFIG.PLATFORM_START_WIDTH,
      index: 0,
      center: BRIDGE_CONFIG.PLATFORM_START_WIDTH / 2,
      right: BRIDGE_CONFIG.PLATFORM_START_WIDTH,
      isMoving: false,
      vx: 0,
      minX: 0,
      maxX: 0,
      initialX: 0,
      baseSpeed: 0,
      patrolSeed: 0,
    };
    platforms.push(firstPlatform);
    if (debugPlatforms) {
      debugPlatforms.push({
        index: firstPlatform.index,
        x: firstPlatform.x,
        w: firstPlatform.w,
        right: firstPlatform.right,
        isMoving: firstPlatform.isMoving,
        vx: firstPlatform.vx,
        minX: firstPlatform.minX,
        maxX: firstPlatform.maxX,
        initialX: firstPlatform.initialX,
      });
    }

    // Generate platforms for each move
    // Frontend uses initialX + w to calculate lastX for next platform (not current x which might have moved)
    let lastX = BRIDGE_CONFIG.PLATFORM_START_WIDTH;
    for (let i = 1; i <= numMoves + 1; i++) {
      // Capture RNG values for debugging (must call rng() before using in randomRange)
      const gapRng = rng();
      const gap =
        BRIDGE_CONFIG.PLATFORM_MIN_GAP +
        gapRng *
          (BRIDGE_CONFIG.PLATFORM_MAX_GAP - BRIDGE_CONFIG.PLATFORM_MIN_GAP);

      const widthRng = rng();
      const baseWidth =
        BRIDGE_CONFIG.PLATFORM_MIN_WIDTH +
        widthRng *
          (BRIDGE_CONFIG.PLATFORM_MAX_WIDTH - BRIDGE_CONFIG.PLATFORM_MIN_WIDTH);
      const shrinkStages =
        i >= BRIDGE_CONFIG.PLATFORM_SHRINK_START_INDEX
          ? Math.floor(
              (i - BRIDGE_CONFIG.PLATFORM_SHRINK_START_INDEX) /
                BRIDGE_CONFIG.PLATFORM_SHRINK_EVERY,
            ) + 1
          : 0;
      const shrinkFactor = Math.pow(
        BRIDGE_CONFIG.PLATFORM_SHRINK_FACTOR,
        shrinkStages,
      );
      const minWidth =
        i < BRIDGE_CONFIG.PLATFORM_MIN_WIDTH_LATE_INDEX
          ? BRIDGE_CONFIG.PLATFORM_MIN_WIDTH_EARLY
          : BRIDGE_CONFIG.PLATFORM_MIN_WIDTH_LATE;
      const w = Math.max(baseWidth * shrinkFactor, minWidth);

      const x = lastX + gap;

      const speedStages =
        i >= BRIDGE_CONFIG.PLATFORM_SPEED_START_INDEX
          ? Math.floor(
              (i - BRIDGE_CONFIG.PLATFORM_SPEED_START_INDEX) /
                BRIDGE_CONFIG.PLATFORM_SPEED_EVERY,
            ) + 1
          : 0;
      const speedMultiplier =
        1 + speedStages * BRIDGE_CONFIG.PLATFORM_SPEED_INCREMENT;
      const baseSpeed = BRIDGE_CONFIG.PLATFORM_MOVE_VELOCITY * speedMultiplier;

      // Determine if platform can move (index > 2, matches engine logic)
      const canMove = i >= BRIDGE_CONFIG.PLATFORM_MOVE_START_INDEX;
      let isMoving = false;
      let vx = 0;
      let minX = x;
      let maxX = x;
      let patrolSeed = 0;

      let moveChanceRng: number | undefined;
      let rangeRng: number | undefined;
      let patrolSeedRng: number | undefined;

      if (canMove) {
        moveChanceRng = rng();
        const shouldMove = moveChanceRng < BRIDGE_CONFIG.PLATFORM_MOVE_CHANCE;
        if (shouldMove) {
          isMoving = true;
          rangeRng = rng();
          const range =
            BRIDGE_CONFIG.PLATFORM_MOVE_MIN_RANGE +
            rangeRng *
              (BRIDGE_CONFIG.PLATFORM_MOVE_MAX_RANGE -
                BRIDGE_CONFIG.PLATFORM_MOVE_MIN_RANGE);
          minX = x - range;
          maxX = x + range;

          const safeMinX = lastX + BRIDGE_CONFIG.PLATFORM_MIN_GAP;
          const safeMaxX = x + BRIDGE_CONFIG.PLATFORM_MIN_GAP;
          minX = Math.max(minX, safeMinX);
          maxX = Math.min(maxX, safeMaxX);
          if (maxX <= minX) {
            isMoving = false;
            vx = 0;
            minX = x;
            maxX = x;
            patrolSeed = 0;
          } else {
            patrolSeedRng = rng();
            patrolSeed = Math.floor(patrolSeedRng * 0xffffffff);
          }
        }
      }

      const platform: Platform = {
        x,
        w,
        index: i,
        center: x + w / 2,
        right: x + w,
        isMoving,
        vx,
        minX,
        maxX,
        initialX: x,
        baseSpeed,
        patrolSeed,
      };
      platforms.push(platform);
      if (debugPlatforms) {
        debugPlatforms.push({
          index: platform.index,
          x: platform.x,
          w: platform.w,
          right: platform.right,
          isMoving: platform.isMoving,
          vx: platform.vx,
          minX: platform.minX,
          maxX: platform.maxX,
          initialX: platform.initialX,
          rng: {
            gapRng,
            widthRng,
            moveChanceRng,
            rangeRng,
            patrolSeedRng,
          },
        });
      }
      lastX = platform.initialX + platform.w;

      // Debug logging for first few platforms
      if (i <= 5) {
        logger.info({
          msg: 'Platform generated (RNG debug)',
          platformIndex: i,
          gapRng: Math.round(gapRng * 1000000) / 1000000,
          widthRng: Math.round(widthRng * 1000000) / 1000000,
          moveChanceRng:
            moveChanceRng !== undefined
              ? Math.round(moveChanceRng * 1000000) / 1000000
              : undefined,
          rangeRng:
            rangeRng !== undefined
              ? Math.round(rangeRng * 1000000) / 1000000
              : undefined,
          gap: Math.round(gap * 100) / 100,
          width: Math.round(w * 100) / 100,
          x: Math.round(x * 100) / 100,
          right: Math.round(platform.right * 100) / 100,
          isMoving,
          canMove,
        });
      }
    }

    return platforms;
  }

  /**
   * Calculate platform position at a specific time, accounting for movement
   * Platforms move during IDLE and GROWING phases, continue through rotation
   *
   * Frontend behavior:
   * - Platforms start moving when created (at game start for initial platforms)
   * - Platform moves continuously during IDLE and GROWING phases
   * - Platform keeps moving until the bridge lands (startTime + landingDuration)
   * - Position is checked at the moment the bridge lands
   */
  private calculatePlatformPositionAtTime(
    platform: Platform,
    idleDurationMs: number,
    moveDuration: number,
  ): number {
    if (!platform.isMoving) {
      // For non-moving platforms, return initialX (which equals x for non-moving platforms)
      // This ensures consistency with frontend which uses the platform's current position
      return platform.initialX;
    }

    // Platform moves during IDLE and GROWING phases, so use idleDurationMs + moveDuration
    // Landing time is when the bridge finishes rotating (idleDurationMs + landingDuration)
    const landingTime = (idleDurationMs + moveDuration) / 1000; // Convert to seconds

    // Closed-form ping-pong motion between minX and maxX (no frame-step drift).
    const range = platform.maxX - platform.minX;
    if (range <= 0) {
      return platform.initialX;
    }

    const rng = this.createRng(platform.patrolSeed);
    let t = 0;
    let x = platform.initialX;
    const speedBase = platform.baseSpeed;
    if (speedBase <= 0) {
      return platform.initialX;
    }
    const span = platform.maxX - platform.minX;
    const minTargetDistance = Math.max(
      BRIDGE_CONFIG.PLATFORM_TARGET_MIN_DISTANCE,
      span * BRIDGE_CONFIG.PLATFORM_TARGET_MIN_DISTANCE_RATIO,
    );

    while (true) {
      let target = x;
      const attempts = 5;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const candidate = platform.minX + rng() * span;
        target = candidate;
        if (
          span <= minTargetDistance ||
          Math.abs(candidate - x) >= minTargetDistance
        ) {
          break;
        }
      }
      const variance =
        platform.index >= BRIDGE_CONFIG.PLATFORM_VARIANCE_START_INDEX
          ? this.randomRange(
              rng,
              BRIDGE_CONFIG.PLATFORM_SPEED_VARIANCE_MIN,
              BRIDGE_CONFIG.PLATFORM_SPEED_VARIANCE_MAX,
            )
          : 1;
      const speed = speedBase * variance;
      if (speed <= 0) {
        return x;
      }
      const dist = Math.abs(target - x);
      if (dist === 0) {
        if (t >= landingTime) return x;
        continue;
      }
      const duration = dist / speed;
      if (t + duration >= landingTime) {
        const dir = target > x ? 1 : -1;
        return x + dir * speed * (landingTime - t);
      }
      t += duration;
      x = target;
    }
  }

  private getRotationTimeMs(): number {
    return (90 / BRIDGE_CONFIG.ROTATE_SPEED) * 1000;
  }

  private getPressDurationMs(landingDurationMs: number): number {
    return Math.max(0, landingDurationMs - this.getRotationTimeMs());
  }

  private calculateBridgeLength(pressDurationMs: number): number {
    return (pressDurationMs / 1000) * BRIDGE_CONFIG.GROW_SPEED;
  }
}
