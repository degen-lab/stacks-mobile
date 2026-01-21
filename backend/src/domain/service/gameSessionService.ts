import crypto from 'crypto';
import { SCORE_MULTIPLIER } from '../../shared/constants';
import {
  DailyStreakChallenge,
  FraudReason,
  GameSession,
  SessionValidationDebug,
  SessionValidationMoveDebug,
  SessionValidationPlatformDebug,
  SessionValidationResult,
} from '../../shared/types';
import { ConsumableItem } from '../entities/consumableItem';
import { ItemType, ItemVariant } from '../entities/enums';
import { User } from '../entities/user';
import { InvalidSeedError } from '../errors/sessionError';

const BRIDGE_CONFIG = {
  GROW_SPEED: 320,
  ROTATE_SPEED: 192,
  PERFECT_TOLERANCE: 3,
  HERO_SIZE: 40,
  HERO_PLATFORM_INSET: 6,
  HERO_MIN_LANDING_DISTANCE: 16,
  PLATFORM_MIN_GAP: 40,
  PLATFORM_MAX_GAP: 200,
  PLATFORM_MIN_WIDTH: 50,
  PLATFORM_MAX_WIDTH: 100,
  PLATFORM_START_WIDTH: 80,
  MAX_BRIDGE_LENGTH: 800,
  PLATFORM_SHRINK_START_INDEX: 15,
  PLATFORM_SHRINK_EVERY: 5,
  PLATFORM_SHRINK_FACTOR: 0.9,
  PLATFORM_MIN_WIDTH_EARLY: 40,
  PLATFORM_MIN_WIDTH_LATE: 25,
  PLATFORM_MIN_WIDTH_LATE_INDEX: 15,
  PLATFORM_MOVE_START_INDEX: 10,
  PLATFORM_MOVE_VELOCITY: 70,
  PLATFORM_MOVE_CHANCE: 0.5,
  PLATFORM_MOVE_MIN_RANGE: 80,
  PLATFORM_MOVE_MAX_RANGE: 240,
  PLATFORM_SPEED_START_INDEX: 10,
  PLATFORM_SPEED_EVERY: 10,
  PLATFORM_SPEED_INCREMENT: 0.03,
  PLATFORM_VARIANCE_START_INDEX: 15,
  PLATFORM_SPEED_VARIANCE_MIN: 0.8,
  PLATFORM_SPEED_VARIANCE_MAX: 1.2,
  PLATFORM_TARGET_MIN_DISTANCE: 70,
  PLATFORM_TARGET_MIN_DISTANCE_RATIO: 0.6,
  MIN_BRIDGE_DURATION: 50,
  MAX_PERFECT_RATE: 0.85,
  MIN_TIME_BETWEEN_MOVES: 100,
  MAX_CONSECUTIVE_PERFECT: 10,
  MIN_VARIANCE_IN_DURATION: 20,
  MIN_SUCCESS_RATE: 0.3, // Minimum 30% success rate (successful moves / total moves)
  MAX_CONSECUTIVE_FAILURES: 5, // Maximum 5 consecutive failures before fraud
};

interface Platform {
  x: number;
  w: number;
  index: number;
  center: number;
  right: number;
  isMoving: boolean;
  minX: number;
  maxX: number;
  initialX: number;
  spawnX: number;
  baseSpeed: number;
}

const PRECISION = 10000;

function calculatePlatformPosInt(
  minX: number,
  maxX: number,
  speed: number,
  timeMs: number,
  index: number,
): number {
  if (speed <= 0 || minX >= maxX) return minX;

  const width = maxX - minX;

  // 1. Cycle Logic
  const baseCycle = 300000 * PRECISION;
  let cycleDuration = Math.floor(baseCycle / speed);
  cycleDuration = Math.max(2000, Math.min(5000, cycleDuration));

  // 2. Identify WHICH loop we are in
  const cycleIndex = Math.floor(timeMs / cycleDuration);
  const timeInCycle = timeMs % cycleDuration;
  const progress = timeInCycle / cycleDuration; // 0.0 to 1.0

  // 3. Deterministic "Random" Target for THIS specific cycle
  // Hash function: combines Platform ID + Cycle ID
  const hash = Math.imul(index ^ cycleIndex, 0x5f356495);
  // Normalize to 0.3 .. 1.0 (30% to 100% reach)
  const reachRatio = 0.3 + ((Math.abs(hash) % 1000) / 1000) * 0.7;

  // This cycle's specific target
  const cycleTargetX = minX + Math.floor(width * reachRatio);
  const xStart = minX;

  // 4. The Move-Stop-Return Schedule
  let currentPos = 0;

  if (progress < 0.4) {
    // PHASE 1: Move Out (0% -> 40%)
    let t = progress / 0.4;
    t = t * t * (3 - 2 * t);
    currentPos = xStart + Math.floor((cycleTargetX - xStart) * t);
  } else if (progress < 0.55) {
    // PHASE 2: The Stop (40% -> 55%)
    currentPos = cycleTargetX;
  } else {
    // PHASE 3: Return (55% -> 100%)
    let t = (progress - 0.55) / 0.45;
    t = t * t * (3 - 2 * t);
    currentPos = cycleTargetX + Math.floor((xStart - cycleTargetX) * t);
  }

  return currentPos;
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

    if (!this.verifySeed(session.seed, session.signature, secret)) {
      throw new InvalidSeedError('Invalid seed signature');
    }

    const itemUsageCount = new Map<ItemVariant, number>();
    for (const usedItem of session.usedItems) {
      const count = itemUsageCount.get(usedItem) || 0;
      itemUsageCount.set(usedItem, count + 1);
    }
    for (const [variant, usageCount] of itemUsageCount.entries()) {
      const item = user.items.find(
        (ownedItem) =>
          ownedItem.type === ItemType.PowerUp &&
          (ownedItem.metadata as { variant?: ItemVariant } | undefined)
            ?.variant === variant,
      ) as ConsumableItem | undefined;

      if (!item)
        return fail(FraudReason.INVALID_ITEM, 'INVALID_ITEM: Missing item');
      if (!('quantity' in item) || typeof item.quantity !== 'number') {
        return fail(FraudReason.INVALID_ITEM, 'INVALID_ITEM: Not consumable');
      }
      if (item.quantity < usageCount) {
        return fail(
          FraudReason.INVALID_ITEM,
          'INVALID_ITEM: Insufficient quantity',
        );
      }
      for (let i = 0; i < usageCount; i++) item.consume();
    }

    if (!session.moves || session.moves.length === 0) {
      return fail(FraudReason.INVALID_DATA, 'INVALID_DATA: Empty moves array');
    }

    const seedNumber = this.parseSeedToNumber(session.seed);
    if (debug) debug.seedNumber = seedNumber;
    const rng = this.createRng(seedNumber);

    const platforms = this.generatePlatformSequence(
      rng,
      session.moves.length,
      debug?.platforms,
    );

    let score = 0;
    let blocksPassed = 0;
    let totalTimePlayed = 0;
    let isFraud = false;
    let currentPlatformIndex = 0;
    let hasValidMoves = false;

    let currentPlatformStoppedRight = platforms[0].right;

    let perfectLandings = 0;
    let successfulLandings = 0;
    let consecutivePerfect = 0;
    let maxConsecutivePerfect = 0;
    let consecutiveFailures = 0;
    let maxConsecutiveFailures = 0;
    const bridgeDurations: number[] = [];
    const timeBetweenMoves: number[] = [];

    const sortedMoves = [...session.moves]
      .map((move, originalIndex) => ({ ...move, originalIndex }))
      .sort((a, b) => a.startTime - b.startTime);

    for (let i = 0; i < sortedMoves.length; i++) {
      const move = sortedMoves[i];
      const prevMove = i > 0 ? sortedMoves[i - 1] : null;
      const idleDurationMs = move.idleDurationMs ?? move.startTime;

      if (move.startTime < 0 || move.duration < 0) {
        return fail(
          FraudReason.INVALID_DATA,
          'INVALID_DATA: Negative startTime or duration',
          i,
        );
      }
      if (prevMove && move.startTime < prevMove.startTime + prevMove.duration) {
        return fail(
          FraudReason.INVALID_DATA,
          'INVALID_DATA: Overlapping moves',
          i,
        );
      }

      const pressDurationMs = this.getPressDurationMs(move.duration);
      bridgeDurations.push(pressDurationMs);
      hasValidMoves = true;
      totalTimePlayed = Math.max(
        totalTimePlayed,
        move.startTime + move.duration,
      );

      if (prevMove) {
        timeBetweenMoves.push(
          move.startTime - (prevMove.startTime + prevMove.duration),
        );
      }

      const bridgeLength = this.calculateBridgeLength(pressDurationMs);

      if (currentPlatformIndex + 1 >= platforms.length) {
        break;
      }

      const nextPlatform = platforms[currentPlatformIndex + 1];

      const landingTimeMs = move.startTime + move.duration;

      const scaledSpeed = nextPlatform.baseSpeed;

      const platformXAtRelease = calculatePlatformPosInt(
        nextPlatform.minX,
        nextPlatform.maxX,
        scaledSpeed,
        landingTimeMs,
        nextPlatform.index,
      );

      const platformRightAtRelease = platformXAtRelease + nextPlatform.w;
      const platformCenterAtRelease = platformXAtRelease + nextPlatform.w / 2;
      const stickTip = currentPlatformStoppedRight + bridgeLength;

      const hit =
        stickTip >= platformXAtRelease && stickTip <= platformRightAtRelease;

      if (debug) {
        debug.moves.push({
          moveIndex: i,
          originalIndex: move.originalIndex,
          startTime: move.startTime,
          duration: move.duration,
          idleDurationMs,
          client: move.debug,
          bridgeLength,
          currentPlatformIndex,
          currentPlatformStoppedRight,
          nextPlatformIndex: nextPlatform.index,
          platformIsMoving: nextPlatform.isMoving,
          platformXAtRelease,
          platformRightAtRelease,
          stickTip,
          hit,
          gap: platformXAtRelease - stickTip,
          distToCenter: hit
            ? Math.abs(stickTip - platformCenterAtRelease)
            : null,
          pointsAwarded: 0, // we fill this below
          isPerfect: false, // we fill this below
        } as SessionValidationMoveDebug);
      }

      if (hit) {
        const distToCenter = Math.abs(stickTip - platformCenterAtRelease);
        const isPerfect = distToCenter <= BRIDGE_CONFIG.PERFECT_TOLERANCE;
        const points = isPerfect ? 3 : 1;

        if (debug && debug.moves.length > 0) {
          const lastDebug = debug.moves[debug.moves.length - 1];
          lastDebug.isPerfect = isPerfect;
          lastDebug.pointsAwarded = points;
        }

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

        // Reset consecutive failures on success
        consecutiveFailures = 0;
      } else {
        consecutivePerfect = 0;
        consecutiveFailures++;
        maxConsecutiveFailures = Math.max(
          maxConsecutiveFailures,
          consecutiveFailures,
        );
      }
    }

    if (!hasValidMoves) {
      return fail(
        FraudReason.INVALID_DATA,
        'INVALID_DATA: No valid moves processed',
      );
    }

    let fraudReason: FraudReason = FraudReason.NONE;

    if (bridgeDurations.length >= 3) {
      const tooFast = bridgeDurations.filter(
        (d) => d < BRIDGE_CONFIG.MIN_BRIDGE_DURATION,
      ).length;
      if (tooFast > 0) {
        isFraud = true;
        fraudReason = FraudReason.TOO_FAST_BRIDGE;
      }

      if (!isFraud) {
        const avg =
          bridgeDurations.reduce((a, b) => a + b, 0) / bridgeDurations.length;
        const variance =
          bridgeDurations.reduce((s, d) => s + Math.pow(d - avg, 2), 0) /
          bridgeDurations.length;
        const stdDev = Math.sqrt(variance);
        const scaledMinVariance = Math.max(
          10,
          BRIDGE_CONFIG.MIN_VARIANCE_IN_DURATION /
            Math.sqrt(bridgeDurations.length),
        );
        if (stdDev < scaledMinVariance) {
          isFraud = true;
          fraudReason = FraudReason.DURATION_VARIANCE_TOO_LOW;
        }
      }
    }

    if (!isFraud && timeBetweenMoves.length >= 3) {
      const tooFast = timeBetweenMoves.filter(
        (t) => t < BRIDGE_CONFIG.MIN_TIME_BETWEEN_MOVES,
      ).length;
      if (tooFast > 0) {
        isFraud = true;
        fraudReason = FraudReason.TOO_FAST_BETWEEN_MOVES;
      }

      if (!isFraud) {
        const avg =
          timeBetweenMoves.reduce((a, b) => a + b, 0) / timeBetweenMoves.length;
        const variance =
          timeBetweenMoves.reduce((s, t) => s + Math.pow(t - avg, 2), 0) /
          timeBetweenMoves.length;
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

    if (
      !isFraud &&
      maxConsecutiveFailures > BRIDGE_CONFIG.MAX_CONSECUTIVE_FAILURES
    ) {
      isFraud = true;
      fraudReason = FraudReason.TOO_MANY_CONSECUTIVE_FAILURES;
    }

    if (!isFraud && sortedMoves.length >= 5) {
      const successRate = successfulLandings / sortedMoves.length;
      if (successRate < BRIDGE_CONFIG.MIN_SUCCESS_RATE) {
        isFraud = true;
        fraudReason = FraudReason.LOW_SUCCESS_RATE;
      }
    }

    if (!isFraud && successfulLandings > 0) {
      const perfectRate = perfectLandings / successfulLandings;
      const threshold =
        sortedMoves.length >= 20 ? 0.9 : BRIDGE_CONFIG.MAX_PERFECT_RATE;

      if (perfectRate > threshold) {
        isFraud = true;
        fraudReason = FraudReason.PERFECT_RATE_TOO_HIGH;
      }
      if (
        !isFraud &&
        maxConsecutivePerfect > BRIDGE_CONFIG.MAX_CONSECUTIVE_PERFECT
      ) {
        isFraud = true;
        fraudReason = FraudReason.TOO_MANY_CONSECUTIVE_PERFECT;
      }
    }

    const finalScore = score * SCORE_MULTIPLIER;

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
    return crypto.createHmac('sha256', secret).update(seed).digest('hex');
  }

  public verifySeed(seed: string, signature: string, secret: string): boolean {
    return signature === this.signSeed(seed, secret);
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
    const normalized = seedHex.startsWith('0x') ? seedHex.slice(2) : seedHex;
    const seedBigInt = BigInt('0x' + normalized);
    return Number(seedBigInt & BigInt(0xffffffff));
  }

  private generatePlatformSequence(
    rng: () => number,
    numMoves: number,
    debugPlatforms?: SessionValidationDebug['platforms'],
  ): Platform[] {
    const platforms: Platform[] = [];

    // Frontend logic matches: initial platform at 0 with integer width
    const firstPlatform: Platform = {
      x: 0,
      w: BRIDGE_CONFIG.PLATFORM_START_WIDTH,
      index: 0,
      center: Math.floor(BRIDGE_CONFIG.PLATFORM_START_WIDTH / 2),
      right: BRIDGE_CONFIG.PLATFORM_START_WIDTH,
      isMoving: false,
      minX: 0,
      maxX: 0,
      initialX: 0,
      spawnX: 0,
      baseSpeed: 0,
    };
    platforms.push(firstPlatform);

    if (debugPlatforms) {
      debugPlatforms.push({
        ...firstPlatform,
        vx: 0,
      } as SessionValidationPlatformDebug);
    }

    let lastXInt = BRIDGE_CONFIG.PLATFORM_START_WIDTH * PRECISION;

    for (let i = 1; i <= numMoves + 1; i++) {
      const gapRng = rng();

      const minGapInt = BRIDGE_CONFIG.PLATFORM_MIN_GAP * PRECISION;
      const maxGapInt = BRIDGE_CONFIG.PLATFORM_MAX_GAP * PRECISION;
      const gapInt = Math.floor(minGapInt + gapRng * (maxGapInt - minGapInt));

      const widthRng = rng();

      const minWidthBaseInt = BRIDGE_CONFIG.PLATFORM_MIN_WIDTH * PRECISION;
      const maxWidthBaseInt = BRIDGE_CONFIG.PLATFORM_MAX_WIDTH * PRECISION;
      const baseWidthInt =
        minWidthBaseInt + widthRng * (maxWidthBaseInt - minWidthBaseInt);

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

      const minWidthThresholdInt =
        (i < BRIDGE_CONFIG.PLATFORM_MIN_WIDTH_LATE_INDEX
          ? BRIDGE_CONFIG.PLATFORM_MIN_WIDTH_EARLY
          : BRIDGE_CONFIG.PLATFORM_MIN_WIDTH_LATE) * PRECISION;

      const wInt = Math.floor(
        Math.max(baseWidthInt * shrinkFactor, minWidthThresholdInt),
      );

      const speedStages =
        i >= BRIDGE_CONFIG.PLATFORM_SPEED_START_INDEX
          ? Math.floor(
              (i - BRIDGE_CONFIG.PLATFORM_SPEED_START_INDEX) /
                BRIDGE_CONFIG.PLATFORM_SPEED_EVERY,
            ) + 1
          : 0;
      const speedMultiplier =
        1 + speedStages * BRIDGE_CONFIG.PLATFORM_SPEED_INCREMENT;

      let rawBaseSpeed = Math.floor(
        BRIDGE_CONFIG.PLATFORM_MOVE_VELOCITY * PRECISION * speedMultiplier,
      );

      const canMove = i >= BRIDGE_CONFIG.PLATFORM_MOVE_START_INDEX;
      let shouldMove = false;

      if (canMove) {
        const moveChanceRng = rng();
        if (moveChanceRng < BRIDGE_CONFIG.PLATFORM_MOVE_CHANCE)
          shouldMove = true;
      }

      let minXInt = 0;
      let maxXInt = 0;
      let spawnXInt = 0;

      const idealXInt = lastXInt + gapInt;

      if (shouldMove) {
        const rangeRng = rng();
        const minRangeInt = BRIDGE_CONFIG.PLATFORM_MOVE_MIN_RANGE * PRECISION;
        const maxRangeInt = BRIDGE_CONFIG.PLATFORM_MOVE_MAX_RANGE * PRECISION;
        const rangeInt = Math.floor(
          minRangeInt + rangeRng * (maxRangeInt - minRangeInt),
        );

        const varianceRng = rng();
        const varianceScaler = Math.floor(varianceRng * 4000) + 8000;

        rawBaseSpeed = Math.floor((rawBaseSpeed * varianceScaler) / 10000);

        minXInt = idealXInt - rangeInt;
        maxXInt = idealXInt + rangeInt;

        const safeMinXInt = lastXInt + minGapInt;
        const safeMaxXInt = lastXInt + maxGapInt;

        minXInt = Math.max(minXInt, safeMinXInt);
        maxXInt = Math.min(maxXInt, safeMaxXInt);

        if (maxXInt <= minXInt) {
          shouldMove = false;
          minXInt = maxXInt = idealXInt;
          rawBaseSpeed = 0;
          spawnXInt = idealXInt;
        } else {
          spawnXInt = Math.floor((minXInt + maxXInt) / 2);
        }
      } else {
        rawBaseSpeed = 0;
        spawnXInt = idealXInt;
        minXInt = spawnXInt;
        maxXInt = spawnXInt;
      }

      const platform: Platform = {
        x: spawnXInt / PRECISION,
        w: wInt / PRECISION,
        index: i,
        center: (spawnXInt + wInt / 2) / PRECISION,
        right: (spawnXInt + wInt) / PRECISION,
        isMoving: shouldMove,
        minX: minXInt / PRECISION,
        maxX: maxXInt / PRECISION,
        initialX: spawnXInt / PRECISION,
        spawnX: spawnXInt / PRECISION,
        baseSpeed: rawBaseSpeed,
      };
      platforms.push(platform);

      if (debugPlatforms) {
        debugPlatforms.push({
          ...platform,
          vx: 0,
        } as SessionValidationPlatformDebug);
      }

      lastXInt = spawnXInt + wInt;
    }
    return platforms;
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
