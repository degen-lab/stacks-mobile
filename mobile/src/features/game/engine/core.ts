import { DIFFICULTY_CONFIG, PHYSICS_CONFIG, VISUAL_CONFIG } from "../config";
import { createRng } from "./rng";
import type {
  EngineEvent,
  PlatformSnapshot,
  PlayerMove,
  MoveClientDebug,
  RenderState,
} from "../types";

const PRECISION = 10000;

const BRIDGE_CONFIG_INT = {
  ...PHYSICS_CONFIG,
  GROW_SPEED: PHYSICS_CONFIG.GROW_SPEED * PRECISION,
  ROTATE_SPEED: PHYSICS_CONFIG.ROTATE_SPEED * PRECISION,
  PLATFORM_MIN_GAP: VISUAL_CONFIG.PLATFORM_MIN_GAP * PRECISION,
  PLATFORM_MAX_GAP: VISUAL_CONFIG.PLATFORM_MAX_GAP * PRECISION,
  PLATFORM_MIN_WIDTH: VISUAL_CONFIG.PLATFORM_MIN_WIDTH * PRECISION,
  PLATFORM_MAX_WIDTH: VISUAL_CONFIG.PLATFORM_MAX_WIDTH * PRECISION,
  PLATFORM_START_WIDTH: VISUAL_CONFIG.PLATFORM_START_WIDTH * PRECISION,
  PLATFORM_MOVE_VELOCITY: PHYSICS_CONFIG.PLATFORM_MOVE_VELOCITY * PRECISION,
  PLATFORM_MOVE_MIN_RANGE: PHYSICS_CONFIG.PLATFORM_MOVE_MIN_RANGE * PRECISION,
  PLATFORM_MOVE_MAX_RANGE: PHYSICS_CONFIG.PLATFORM_MOVE_MAX_RANGE * PRECISION,
  PLATFORM_MIN_WIDTH_EARLY:
    DIFFICULTY_CONFIG.PLATFORM_MIN_WIDTH_EARLY * PRECISION,
  PLATFORM_MIN_WIDTH_LATE:
    DIFFICULTY_CONFIG.PLATFORM_MIN_WIDTH_LATE * PRECISION,
  PERFECT_TOLERANCE: VISUAL_CONFIG.PERFECT_TOLERANCE * PRECISION,
  MAX_BRIDGE_LENGTH: VISUAL_CONFIG.MAX_BRIDGE_LENGTH * PRECISION,
};

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

  // 2. Identify Cycle
  const cycleIndex = Math.floor(timeMs / cycleDuration);
  const timeInCycle = timeMs % cycleDuration;
  const progress = timeInCycle / cycleDuration;

  // 3. Shifting Sentry Target
  const hash = Math.imul(index ^ cycleIndex, 0x5f356495);
  const reachRatio = 0.3 + ((Math.abs(hash) % 1000) / 1000) * 0.7;

  const cycleTargetX = minX + Math.floor(width * reachRatio);
  const xStart = minX;

  // 4. Move Schedule
  let currentPos = 0;

  if (progress < 0.4) {
    // PHASE 1: Move Out
    let t = progress / 0.4;
    t = t * t * (3 - 2 * t);
    currentPos = xStart + Math.floor((cycleTargetX - xStart) * t);
  } else if (progress < 0.55) {
    // PHASE 2: Stop
    currentPos = cycleTargetX;
  } else {
    // PHASE 3: Return
    let t = (progress - 0.55) / 0.45;
    t = t * t * (3 - 2 * t);
    currentPos = cycleTargetX + Math.floor((xStart - cycleTargetX) * t);
  }

  return currentPos;
}

class Camera {
  x = 0;
  targetX = 0;
  shakeIntensity = 0;

  update(dt: number) {
    const diff = this.targetX - this.x;
    if (Math.abs(diff) < 1) {
      this.x = this.targetX;
    } else {
      this.x += diff * Math.min(1, dt * PHYSICS_CONFIG.SCROLL_SPEED);
    }

    if (this.shakeIntensity > 0) {
      this.shakeIntensity -= dt * PHYSICS_CONFIG.SHAKE_DECAY;
      if (this.shakeIntensity < 0) this.shakeIntensity = 0;
    }
  }

  trigger(amount: number) {
    this.shakeIntensity = amount;
  }
}

class Platform {
  x: number;
  w: number;
  index: number;
  isMoving: boolean;
  minX: number;
  maxX: number;
  initialX: number;
  spawnX: number;
  speed: number;

  constructor(
    x: number,
    w: number,
    index: number,
    isMoving: boolean,
    minX: number,
    maxX: number,
    spawnX: number,
    speed: number,
  ) {
    this.x = x;
    this.w = w;
    this.index = index;
    this.isMoving = isMoving;
    this.minX = minX;
    this.maxX = maxX;
    this.initialX = x;
    this.spawnX = spawnX;
    this.speed = speed;
  }

  get rightFloat() {
    return (this.x + this.w) / PRECISION;
  }
  get xFloat() {
    return this.x / PRECISION;
  }
  get wFloat() {
    return this.w / PRECISION;
  }
  get centerFloat() {
    return (this.x + this.w / 2) / PRECISION;
  }

  update(globalTimeMs: number) {
    if (!this.isMoving) {
      this.x = this.initialX;
      return;
    }
    this.x = calculatePlatformPosInt(
      this.minX,
      this.maxX,
      this.speed,
      globalTimeMs,
      this.index,
    );
  }

  stop() {
    this.isMoving = false;
    this.initialX = this.x;
    this.minX = this.x;
    this.maxX = this.x;
    this.speed = 0;
  }

  snapshot(): PlatformSnapshot {
    return { x: this.x, w: this.w, index: this.index };
  }
}

class Bridge {
  length = 0;
  rotation = 0;
  grow(dt: number) {
    this.length += PHYSICS_CONFIG.GROW_SPEED * dt;
    if (this.length > VISUAL_CONFIG.MAX_BRIDGE_LENGTH)
      this.length = VISUAL_CONFIG.MAX_BRIDGE_LENGTH;
  }
  reset() {
    this.length = 0;
    this.rotation = 0;
  }
}

class Hero {
  x = 0;
  y = 0;
  rotation = 0;
  resetToPlatform(p: Platform) {
    this.x = p.xFloat + p.wFloat - VISUAL_CONFIG.HERO_SIZE;
    this.y =
      VISUAL_CONFIG.CANVAS_H -
      VISUAL_CONFIG.PLATFORM_H -
      VISUAL_CONFIG.HERO_SIZE;
    this.rotation = 0;
  }
}

export class StacksBridgeEngine {
  private rng: () => number;
  private seed: number;
  private camera = new Camera();
  private bridge = new Bridge();
  private hero = new Hero();
  private platforms: Platform[] = [];

  private phase: RenderState["phase"] = "IDLE";
  private perfect = false;
  private lastMoveDebug: MoveClientDebug | null = null;
  private score = 0;
  private hasRevived = false;

  //TODO: check if this is needed
  private lastJumpSucceeded = true;

  private moves: PlayerMove[] = [];
  private currentPressStart: number | null = null;

  private engineTimeMs = 0;
  private idleStartTime = 0;

  private cachedRenderState: RenderState = {
    phase: "IDLE",
    cameraX: 0,
    shakeIntensity: 0,
    hero: { x: 0, y: 0, rotation: 0 },
    stick: { length: 0, rotation: 0 },
    platforms: [],
    score: 0,
  };

  private particleSpawn?: (
    x: number,
    y: number,
    color: string,
    count?: number,
  ) => void;

  constructor() {
    this.seed = 0;
    this.rng = createRng(0);
    this.platforms = [];
  }

  start(seed?: number) {
    if (seed === undefined) throw new Error("start() called without seed");
    this.seed = seed;
    this.rng = createRng(this.seed);
    this.resetWorld();
  }

  reset(seed?: number) {
    if (seed !== undefined) this.seed = seed;
    this.rng = createRng(this.seed);
    this.resetWorld();
  }

  setParticleEmitter(spawn: any) {
    this.particleSpawn = spawn;
  }
  get state() {
    return { score: this.score, phase: this.phase };
  }
  getRunData() {
    return { seed: this.seed, moves: [...this.moves] };
  }

  revive() {
    this.performRevive();
    this.hasRevived = true;
  }

  revivePowerUp() {
    this.performRevive();
  }

  updatePlatformsOnly(totalTimeMs: number) {
    this.engineTimeMs = totalTimeMs;

    this.platforms.forEach((p) => {
      if (p.isMoving) {
        p.update(Math.floor(this.engineTimeMs));
      }
    });
  }

  private performRevive() {
    const safePlatform = this.platforms[0];
    if (!safePlatform) return;

    this.hero.resetToPlatform(safePlatform);
    this.bridge.reset();
    this.phase = "IDLE";
    this.camera.targetX = safePlatform.xFloat;
    this.camera.x = safePlatform.xFloat;

    safePlatform.stop();

    this.idleStartTime = Math.floor(this.engineTimeMs);

    for (let i = 1; i < this.platforms.length; i++) {
      this.platforms[i].update(Math.floor(this.engineTimeMs));
    }
  }

  private resetWorld() {
    this.moves = [];
    this.currentPressStart = null;
    this.hasRevived = false;
    this.lastJumpSucceeded = true;
    this.idleStartTime = 0;
    this.engineTimeMs = 0;

    const p0 = new Platform(
      0,
      BRIDGE_CONFIG_INT.PLATFORM_START_WIDTH,
      0,
      false,
      0,
      0,
      0,
      0,
    );
    const p1 = this.generateNextPlatform(
      BRIDGE_CONFIG_INT.PLATFORM_START_WIDTH,
      1,
    );
    const p2 = this.generateNextPlatform(p1.spawnX + p1.w, 2);
    this.platforms = [p0, p1, p2];

    this.hero.resetToPlatform(this.platforms[0]);
    this.bridge.reset();
    this.camera.x = 0;
    this.camera.targetX = 0;
    this.camera.shakeIntensity = 0;
    this.phase = "IDLE";
    this.score = 0;
  }

  private generateNextPlatform(lastX: number, index: number) {
    const gapRng = this.rng();
    const gap = Math.floor(
      BRIDGE_CONFIG_INT.PLATFORM_MIN_GAP +
        gapRng *
          (BRIDGE_CONFIG_INT.PLATFORM_MAX_GAP -
            BRIDGE_CONFIG_INT.PLATFORM_MIN_GAP),
    );

    const widthRng = this.rng();
    const baseWidth =
      BRIDGE_CONFIG_INT.PLATFORM_MIN_WIDTH +
      widthRng *
        (BRIDGE_CONFIG_INT.PLATFORM_MAX_WIDTH -
          BRIDGE_CONFIG_INT.PLATFORM_MIN_WIDTH);

    const canMove = index >= DIFFICULTY_CONFIG.PLATFORM_MOVE_START_INDEX;
    let shouldMove = false;

    if (canMove) {
      const moveChanceRng = this.rng();
      shouldMove = moveChanceRng < PHYSICS_CONFIG.PLATFORM_MOVE_CHANCE;
    }

    const shrinkStages =
      index >= DIFFICULTY_CONFIG.PLATFORM_SHRINK_START_INDEX
        ? Math.floor(
            (index - DIFFICULTY_CONFIG.PLATFORM_SHRINK_START_INDEX) /
              DIFFICULTY_CONFIG.PLATFORM_SHRINK_EVERY,
          ) + 1
        : 0;
    const shrinkFactor = Math.pow(
      DIFFICULTY_CONFIG.PLATFORM_SHRINK_FACTOR,
      shrinkStages,
    );
    const minWidth =
      index < DIFFICULTY_CONFIG.PLATFORM_MIN_WIDTH_LATE_INDEX
        ? BRIDGE_CONFIG_INT.PLATFORM_MIN_WIDTH_EARLY
        : BRIDGE_CONFIG_INT.PLATFORM_MIN_WIDTH_LATE;

    const w = Math.floor(Math.max(baseWidth * shrinkFactor, minWidth));

    const speedStages =
      index >= DIFFICULTY_CONFIG.PLATFORM_SPEED_START_INDEX
        ? Math.floor(
            (index - DIFFICULTY_CONFIG.PLATFORM_SPEED_START_INDEX) /
              DIFFICULTY_CONFIG.PLATFORM_SPEED_EVERY,
          ) + 1
        : 0;
    const speedMultiplier =
      1 + speedStages * DIFFICULTY_CONFIG.PLATFORM_SPEED_INCREMENT;
    let baseSpeed = Math.floor(
      BRIDGE_CONFIG_INT.PLATFORM_MOVE_VELOCITY * speedMultiplier,
    );

    let minX = 0;
    let maxX = 0;
    let spawnX = 0;
    const idealX = lastX + gap;

    if (shouldMove) {
      const rangeRng = this.rng();
      const range = Math.floor(
        BRIDGE_CONFIG_INT.PLATFORM_MOVE_MIN_RANGE +
          rangeRng *
            (BRIDGE_CONFIG_INT.PLATFORM_MOVE_MAX_RANGE -
              BRIDGE_CONFIG_INT.PLATFORM_MOVE_MIN_RANGE),
      );

      const varianceRng = this.rng();
      const varianceScaler = Math.floor(varianceRng * 4000) + 8000;
      baseSpeed = Math.floor((baseSpeed * varianceScaler) / 10000);

      minX = idealX - range;
      maxX = idealX + range;

      const safeMinX = lastX + BRIDGE_CONFIG_INT.PLATFORM_MIN_GAP;
      const safeMaxX = lastX + BRIDGE_CONFIG_INT.PLATFORM_MAX_GAP;

      minX = Math.max(minX, safeMinX);
      maxX = Math.min(maxX, safeMaxX);

      if (maxX <= minX) {
        shouldMove = false;
        minX = maxX = idealX;
        baseSpeed = 0;
        spawnX = idealX;
      } else {
        spawnX = Math.floor((minX + maxX) / 2);
      }
    } else {
      baseSpeed = 0;
      spawnX = idealX;
      minX = spawnX;
      maxX = spawnX;
    }

    return new Platform(
      spawnX,
      w,
      index,
      shouldMove,
      minX,
      maxX,
      spawnX,
      baseSpeed,
    );
  }

  handleInputDown(isPlaying: boolean) {
    if (!isPlaying || this.phase !== "IDLE") return;
    this.phase = "GROWING";
    this.currentPressStart = Math.floor(this.engineTimeMs);
  }

  handleInputUp(isPlaying: boolean) {
    if (!isPlaying || this.phase !== "GROWING") return;
    this.phase = "ROTATING";

    if (this.currentPressStart !== null) {
      const maxDurationMs = Math.floor(
        (VISUAL_CONFIG.MAX_BRIDGE_LENGTH / PHYSICS_CONFIG.GROW_SPEED) * 1000,
      );
      const pressDuration = Math.min(
        Math.floor(this.engineTimeMs) - this.currentPressStart,
        maxDurationMs,
      );

      this.bridge.length = (pressDuration / 1000) * PHYSICS_CONFIG.GROW_SPEED;

      const idleDurationMs = Math.max(
        0,
        this.currentPressStart - this.idleStartTime,
      );
      const rotationTimeMs = (90 / PHYSICS_CONFIG.ROTATE_SPEED) * 1000;
      const landingDuration = pressDuration + rotationTimeMs;

      const debugInfo: MoveClientDebug | undefined = __DEV__
        ? {
            stickTip: 0,
            bridgeLength: this.bridge.length,
            currentPlatformRight: this.platforms[0].rightFloat,
            nextPlatformIndex: this.platforms[1]?.index ?? 0,
            platformX: 0,
            platformIsMoving: this.platforms[1]?.isMoving ?? false,
          }
        : undefined;

      this.moves.push({
        startTime: this.currentPressStart,
        duration: landingDuration,
        idleDurationMs,
        ...(debugInfo && { debug: debugInfo }),
      });

      this.lastMoveDebug = debugInfo ?? null;
      this.currentPressStart = null;
    }
  }

  step(isPlaying: boolean, dt: number, totalTimeMs: number): EngineEvent[] {
    const events: EngineEvent[] = [];
    if (!isPlaying) return events;

    this.engineTimeMs = totalTimeMs;

    this.camera.update(dt);
    this.platforms.forEach((p) => p.update(Math.floor(this.engineTimeMs)));

    switch (this.phase) {
      case "GROWING":
        this.bridge.grow(dt);
        this.camera.trigger(0.8);
        break;
      case "ROTATING":
        this.bridge.rotation += PHYSICS_CONFIG.ROTATE_SPEED * dt;
        if (this.bridge.rotation >= 90) {
          this.bridge.rotation = 90;
          this.phase = "WALKING";
          this.camera.trigger(3);
          this.checkLanding(events);
        }
        break;
      case "WALKING":
        this.updateHeroWalking(dt, events);
        break;
      case "FALLING":
        this.updateHeroFalling(dt, events);
        break;
      case "SCROLLING":
        if (Math.abs(this.camera.x - this.camera.targetX) < 5) {
          this.camera.x = this.camera.targetX;
          this.advancePlatform();
        }
        break;
    }
    return events;
  }

  private checkLanding(events: EngineEvent[]) {
    const pCurrent = this.platforms[0];
    const pNext = this.platforms[1];
    if (!pCurrent || !pNext) return;

    const lastMove = this.moves[this.moves.length - 1];
    if (lastMove && pNext.isMoving) {
      const theoreticalLandingTime = Math.floor(
        lastMove.startTime + lastMove.duration,
      );
      pNext.update(theoreticalLandingTime);
    }

    const bridgeInt = Math.floor(this.bridge.length * PRECISION);
    const stickTipInt = pCurrent.x + pCurrent.w + bridgeInt;
    const hit = stickTipInt >= pNext.x && stickTipInt <= pNext.x + pNext.w;

    // Update debug info with actual landing values
    if (lastMove?.debug && __DEV__) {
      const stickTipFloat = pCurrent.rightFloat + this.bridge.length;
      lastMove.debug.stickTip = stickTipFloat;
      lastMove.debug.platformX = pNext.xFloat;
      lastMove.debug.platformRight = pNext.rightFloat;
      lastMove.debug.platformCenter = pNext.centerFloat;

      if (hit) {
        const distToCenterFloat = Math.abs(stickTipFloat - pNext.centerFloat);
        lastMove.debug.distToCenter = distToCenterFloat;
      } else {
        lastMove.debug.distToCenter = null;
      }
    }

    if (hit) {
      pNext.stop();

      const stickTipFloat = pCurrent.rightFloat + this.bridge.length;
      const distToCenterFloat = Math.abs(stickTipFloat - pNext.centerFloat);

      this.perfect = distToCenterFloat <= VISUAL_CONFIG.PERFECT_TOLERANCE;

      if (this.perfect) {
        events.push({
          type: "perfect",
          x: pNext.centerFloat,
          y: VISUAL_CONFIG.CANVAS_H - VISUAL_CONFIG.PLATFORM_H - 24,
        });
      }
      if (this.particleSpawn) {
        this.particleSpawn(
          stickTipFloat,
          VISUAL_CONFIG.CANVAS_H - VISUAL_CONFIG.PLATFORM_H,
          VISUAL_CONFIG.COLORS.TEXT_SUB,
          10,
        );
      }

      this.lastJumpSucceeded = true;
    } else {
      this.lastJumpSucceeded = false;
    }
  }

  private updateHeroWalking(dt: number, events: EngineEvent[]) {
    this.hero.x += PHYSICS_CONFIG.WALK_SPEED * dt;

    const currentPlatform = this.platforms[0];
    if (!currentPlatform) {
      this.phase = "IDLE";
      return;
    }
    const p1 = this.platforms[1];
    const stickTip = currentPlatform.rightFloat + this.bridge.length;
    const heroFront = this.hero.x + VISUAL_CONFIG.HERO_SIZE;

    const hit = p1 && stickTip >= p1.xFloat && stickTip <= p1.rightFloat;
    const hasLanded =
      hit &&
      p1 &&
      heroFront >= p1.xFloat &&
      this.hero.x >=
        p1.rightFloat -
          VISUAL_CONFIG.HERO_SIZE -
          VISUAL_CONFIG.HERO_MIN_LANDING_DISTANCE;

    if (!hit && heroFront > stickTip) {
      this.hero.x = stickTip;
      this.phase = "FALLING";
      this.lastJumpSucceeded = false;
    } else if (hasLanded) {
      const inset = VISUAL_CONFIG.HERO_PLATFORM_INSET;
      const maxX = p1.rightFloat - VISUAL_CONFIG.HERO_SIZE - inset;

      this.hero.x = Math.min(this.hero.x, maxX);
      this.handleSuccess(p1, events);
    }
  }

  private updateHeroFalling(dt: number, events: EngineEvent[]) {
    this.hero.y += PHYSICS_CONFIG.GRAVITY * dt;
    this.hero.rotation += PHYSICS_CONFIG.FALL_ROTATION * dt;
    this.bridge.rotation += PHYSICS_CONFIG.ROTATE_SPEED * dt;

    if (this.hero.y > VISUAL_CONFIG.CANVAS_H + 100) {
      if (!this.hasRevived && this.score > 0) {
        events.push({ type: "revivePrompt", value: this.score });
      } else {
        events.push({
          type: "gameOver",
          value: this.score,
          seed: this.seed,
          moves: [...this.moves],
        });
      }
    }
  }

  private handleSuccess(p: Platform, events: EngineEvent[]) {
    const isPerfect = this.perfect;
    this.perfect = false;
    this.score += isPerfect ? 3 : 1;
    events.push({ type: "score", value: this.score });

    if (isPerfect && this.particleSpawn) {
      this.particleSpawn(
        p.centerFloat,
        this.hero.y,
        VISUAL_CONFIG.COLORS.BRAND,
        24,
      );
    }

    const old = this.platforms[1];
    if (old && this.platforms.length < 3) {
      const lastX = old.spawnX + old.w;
      const newPlatform = this.generateNextPlatform(lastX, old.index + 1);
      this.platforms.push(newPlatform);
    }

    this.lastJumpSucceeded = true;

    this.phase = "SCROLLING";
    this.camera.targetX = p.xFloat;
  }

  private advancePlatform() {
    if (this.lastJumpSucceeded && this.platforms.length > 1) {
      this.platforms.shift();
    }
    this.bridge.reset();
    this.phase = "IDLE";
    this.lastJumpSucceeded = true;
    this.idleStartTime = Math.floor(this.engineTimeMs);
  }

  getRenderState(): RenderState {
    const visibleCount =
      this.phase === "SCROLLING"
        ? Math.min(3, this.platforms.length)
        : Math.min(2, this.platforms.length);
    if (this.cachedRenderState.platforms.length !== visibleCount) {
      this.cachedRenderState.platforms = new Array(visibleCount)
        .fill(null)
        .map(() => ({ x: 0, w: 0, index: 0 }));
    }

    for (let i = 0; i < visibleCount; i++) {
      const p = this.platforms[i];
      this.cachedRenderState.platforms[i].x = p.xFloat;
      this.cachedRenderState.platforms[i].w = p.wFloat;
      this.cachedRenderState.platforms[i].index = p.index;
    }

    this.cachedRenderState.phase = this.phase;
    this.cachedRenderState.cameraX = this.camera.x;
    this.cachedRenderState.shakeIntensity = this.camera.shakeIntensity;
    this.cachedRenderState.hero.x = this.hero.x;
    this.cachedRenderState.hero.y = this.hero.y;
    this.cachedRenderState.hero.rotation = this.hero.rotation;
    this.cachedRenderState.stick.length = this.bridge.length;
    this.cachedRenderState.stick.rotation = this.bridge.rotation;
    this.cachedRenderState.score = this.score;

    return this.cachedRenderState;
  }
}

export type { EngineEvent, PlatformSnapshot as Platform, RenderState };
