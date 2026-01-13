import { DIFFICULTY_CONFIG, PHYSICS_CONFIG, VISUAL_CONFIG } from "../config";
import { createRng, randomRange } from "./rng";
import type {
  EngineEvent,
  PlatformSnapshot,
  PlayerMove,
  MoveClientDebug,
  RenderState,
} from "../types";

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
  vx: number;
  minX: number;
  maxX: number;
  initialX: number; // Store initial position for platform generation
  moveTime: number;
  baseSpeed: number;
  patrolSeed: number;

  constructor(
    x: number,
    w: number,
    index: number,
    isMoving: boolean,
    minX: number,
    maxX: number,
    baseSpeed: number,
    patrolSeed: number,
  ) {
    this.x = x;
    this.w = w;
    this.index = index;
    this.isMoving = isMoving;
    this.vx = 0;
    this.minX = minX;
    this.maxX = maxX;
    this.initialX = x; // Store initial position
    this.moveTime = 0;
    this.baseSpeed = baseSpeed;
    this.patrolSeed = patrolSeed;
  }

  get right() {
    return this.x + this.w;
  }
  get center() {
    return this.x + this.w / 2;
  }

  getXAtTime(timeSec: number) {
    if (!this.isMoving) return this.initialX;
    const range = this.maxX - this.minX;
    if (range <= 0) return this.initialX;
    const rng = createRng(this.patrolSeed);
    let t = 0;
    let x = this.initialX;
    const speedBase = this.baseSpeed;
    if (speedBase <= 0) return this.initialX;
    const span = this.maxX - this.minX;
    const minTargetDistance = Math.max(
      DIFFICULTY_CONFIG.PLATFORM_TARGET_MIN_DISTANCE,
      span * DIFFICULTY_CONFIG.PLATFORM_TARGET_MIN_DISTANCE_RATIO,
    );

    while (true) {
      let target = x;
      const attempts = 5;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const candidate = this.minX + rng() * span;
        target = candidate;
        if (
          span <= minTargetDistance ||
          Math.abs(candidate - x) >= minTargetDistance
        ) {
          break;
        }
      }
      const variance =
        this.index >= DIFFICULTY_CONFIG.PLATFORM_VARIANCE_START_INDEX
          ? randomRange(
              rng,
              DIFFICULTY_CONFIG.PLATFORM_SPEED_VARIANCE_MIN,
              DIFFICULTY_CONFIG.PLATFORM_SPEED_VARIANCE_MAX,
            )
          : 1;
      const speed = speedBase * variance;
      if (speed <= 0) return x;
      const dist = Math.abs(target - x);
      if (dist === 0) {
        if (t >= timeSec) return x;
        continue;
      }
      const duration = dist / speed;
      if (t + duration >= timeSec) {
        const dir = target > x ? 1 : -1;
        return x + dir * speed * (timeSec - t);
      }
      t += duration;
      x = target;
    }
  }

  update(deltaTime: number) {
    if (!this.isMoving) return;
    this.moveTime += deltaTime;
    this.x = this.getXAtTime(this.moveTime);
  }

  stop() {
    this.isMoving = false;
    this.vx = 0;
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
    this.x = p.x + p.w - VISUAL_CONFIG.HERO_SIZE;
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

  private moves: PlayerMove[] = [];
  private currentPressStart: number | null = null;
  private engineTimeMs = 0;
  private idleStartTime = 0;

  // Cache render state to avoid allocations every frame
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
    if (seed === undefined) {
      throw new Error("start() must be called with a seed");
    }
    this.seed = seed;
    this.rng = createRng(this.seed);
    this.resetWorld();
  }

  reset(seed?: number) {
    if (seed !== undefined) {
      this.seed = seed;
    }
    this.rng = createRng(this.seed);
    this.resetWorld();
  }

  setParticleEmitter(
    spawn: (x: number, y: number, color: string, count?: number) => void,
  ) {
    this.particleSpawn = spawn;
  }

  get state() {
    return {
      score: this.score,
      phase: this.phase,
    };
  }

  getRunData() {
    return {
      seed: this.seed,
      moves: [...this.moves],
    };
  }

  revive() {
    this.hasRevived = true;
    const safePlatform = this.platforms[0];
    if (!safePlatform) return;
    this.hero.resetToPlatform(safePlatform);
    this.bridge.reset();
    this.phase = "IDLE";
    this.camera.targetX = safePlatform.x;
    this.camera.x = safePlatform.x;
    this.idleStartTime = Math.floor(this.engineTimeMs);
  }

  revivePowerUp() {
    // Revive without setting hasRevived flag, so ad revive is still available
    const safePlatform = this.platforms[0];
    if (!safePlatform) return;
    this.hero.resetToPlatform(safePlatform);
    this.bridge.reset();
    this.phase = "IDLE";
    this.camera.targetX = safePlatform.x;
    this.camera.x = safePlatform.x;
    this.idleStartTime = Math.floor(this.engineTimeMs);
  }

  private resetWorld() {
    this.moves = [];
    this.currentPressStart = null;
    this.hasRevived = false;
    this.idleStartTime = 0;
    this.engineTimeMs = 0;

    // Pre-generate 3 platforms so the third is ready to scroll into view
    const platform0 = new Platform(
      0,
      VISUAL_CONFIG.PLATFORM_START_WIDTH,
      0,
      false,
      0,
      0,
      0,
      0,
    );
    const platform1 = this.generateNextPlatform(
      VISUAL_CONFIG.PLATFORM_START_WIDTH,
      1,
    );
    const platform2 = this.generateNextPlatform(
      platform1.initialX + platform1.w,
      2,
    );
    this.platforms = [platform0, platform1, platform2];

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
    const gap =
      gapRng *
        (VISUAL_CONFIG.PLATFORM_MAX_GAP - VISUAL_CONFIG.PLATFORM_MIN_GAP) +
      VISUAL_CONFIG.PLATFORM_MIN_GAP;

    const widthRng = this.rng();
    const baseWidth =
      widthRng *
        (VISUAL_CONFIG.PLATFORM_MAX_WIDTH - VISUAL_CONFIG.PLATFORM_MIN_WIDTH) +
      VISUAL_CONFIG.PLATFORM_MIN_WIDTH;

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
        ? DIFFICULTY_CONFIG.PLATFORM_MIN_WIDTH_EARLY
        : DIFFICULTY_CONFIG.PLATFORM_MIN_WIDTH_LATE;
    const w = Math.max(baseWidth * shrinkFactor, minWidth);

    const speedStages =
      index >= DIFFICULTY_CONFIG.PLATFORM_SPEED_START_INDEX
        ? Math.floor(
            (index - DIFFICULTY_CONFIG.PLATFORM_SPEED_START_INDEX) /
              DIFFICULTY_CONFIG.PLATFORM_SPEED_EVERY,
          ) + 1
        : 0;
    const speedMultiplier =
      1 + speedStages * DIFFICULTY_CONFIG.PLATFORM_SPEED_INCREMENT;
    const baseSpeed = PHYSICS_CONFIG.PLATFORM_MOVE_VELOCITY * speedMultiplier;

    const canMove = index >= DIFFICULTY_CONFIG.PLATFORM_MOVE_START_INDEX;
    let shouldMove = false;
    if (canMove) {
      const moveChanceRng = this.rng();
      shouldMove = moveChanceRng < PHYSICS_CONFIG.PLATFORM_MOVE_CHANCE;
    }
    let minX = lastX + gap;
    let maxX = lastX + gap;
    let patrolSeed = 0;
    if (shouldMove) {
      const range = randomRange(
        this.rng,
        PHYSICS_CONFIG.PLATFORM_MOVE_MIN_RANGE,
        PHYSICS_CONFIG.PLATFORM_MOVE_MAX_RANGE,
      );
      minX = lastX + gap - range;
      maxX = lastX + gap + range;
      patrolSeed = Math.floor(this.rng() * 0xffffffff);
    }

    const platform = new Platform(
      lastX + gap,
      w,
      index,
      shouldMove,
      minX,
      maxX,
      baseSpeed,
      patrolSeed,
    );

    if (platform.isMoving) {
      const safeMinX = lastX + VISUAL_CONFIG.PLATFORM_MIN_GAP;
      const safeMaxX = platform.initialX + VISUAL_CONFIG.PLATFORM_MIN_GAP;
      platform.minX = Math.max(platform.minX, safeMinX);
      platform.maxX = Math.min(platform.maxX, safeMaxX);
      if (platform.maxX <= platform.minX) {
        platform.isMoving = false;
        platform.vx = 0;
        platform.minX = platform.initialX;
        platform.maxX = platform.initialX;
        platform.patrolSeed = 0;
      }
    }

    return platform;
  }

  private getPlatformXAtRelease(
    platform: Platform | undefined,
    idleDurationMs: number,
    moveDurationMs: number,
  ) {
    if (!platform) return null;
    if (!platform.isMoving) return platform.x;

    const releaseTime = (idleDurationMs + moveDurationMs) / 1000;
    return platform.getXAtTime(releaseTime);
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
      const duration = Math.min(
        Math.floor(this.engineTimeMs) - this.currentPressStart,
        maxDurationMs,
      );
      const bridgeLength = (duration / 1000) * PHYSICS_CONFIG.GROW_SPEED;
      const idleDurationMs = Math.max(
        0,
        this.currentPressStart - this.idleStartTime,
      );
      const currentPlatform = this.platforms[0];
      const nextPlatform = this.platforms[1];

      // Platform keeps moving after release until bridge lands
      // Calculate landing time: release + rotation time (90 degrees / ROTATE_SPEED)
      const rotationTimeMs = (90 / PHYSICS_CONFIG.ROTATE_SPEED) * 1000;
      const landingDuration = duration + rotationTimeMs;

      const platformXAtLanding = this.getPlatformXAtRelease(
        nextPlatform,
        idleDurationMs,
        landingDuration,
      );
      const platformRightAtLanding =
        platformXAtLanding !== null && nextPlatform
          ? platformXAtLanding + nextPlatform.w
          : null;
      const platformCenterAtLanding =
        platformXAtLanding !== null && nextPlatform
          ? platformXAtLanding + nextPlatform.w / 2
          : null;
      this.bridge.length = bridgeLength;
      const stickTip = currentPlatform
        ? currentPlatform.right + bridgeLength
        : null;

      const debugInfo: MoveClientDebug | undefined = __DEV__
        ? {
            stickTip,
            bridgeLength,
            currentPlatformRight: null, // Will be set in checkLanding after platform stops
            nextPlatformIndex: nextPlatform?.index ?? null,
            platformX: platformXAtLanding,
            platformRight: platformRightAtLanding,
            platformCenter: platformCenterAtLanding,
            platformIsMoving: nextPlatform?.isMoving ?? null,
          }
        : undefined;

      this.moves.push({
        startTime: this.currentPressStart,
        duration: landingDuration, // Use landing time (release + rotation) for backend validation
        idleDurationMs,
        ...(debugInfo && { debug: debugInfo }),
      });
      this.lastMoveDebug = debugInfo ?? null;
      this.currentPressStart = null;
    }

    // Platform keeps moving until bridge lands (makes game harder)
  }

  step(isPlaying: boolean, dt: number): EngineEvent[] {
    const events: EngineEvent[] = [];
    if (!isPlaying) return events;

    this.engineTimeMs += dt * 1000;

    this.camera.update(dt);

    // Update moving platforms based on phase
    if (
      this.phase === "IDLE" ||
      this.phase === "GROWING" ||
      this.phase === "ROTATING" ||
      this.phase === "WALKING"
    ) {
      // Keep platform moving until bridge lands (makes game harder)
      this.platforms[1]?.update(dt);
    } else if (this.phase === "SCROLLING") {
      // During scrolling, update the next platform (index 2) so it starts moving immediately
      this.platforms[2]?.update(dt);
    }

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

    if (!pCurrent || !pNext) {
      this.perfect = false;
      return;
    }

    // Use CURRENT visual platform positions for collision detection
    const platformX = pNext.x;
    const platformRight = pNext.right;
    const platformCenter = pNext.center;

    // Stop the platform now that bridge has landed
    if (pNext.isMoving) {
      pNext.stop();
    }

    // Use actual current platform position for stickTip calculation
    const stickTip = pCurrent.right + this.bridge.length;
    const hit = stickTip >= platformX && stickTip <= platformRight;
    const distToCenter = Math.abs(stickTip - platformCenter);
    this.perfect = hit && distToCenter <= VISUAL_CONFIG.PERFECT_TOLERANCE;

    if (this.perfect) {
      events.push({
        type: "perfect",
        x: pNext.center,
        y: VISUAL_CONFIG.CANVAS_H - VISUAL_CONFIG.PLATFORM_H - 24,
      });
    }

    if (hit && this.particleSpawn) {
      this.particleSpawn(
        stickTip,
        VISUAL_CONFIG.CANVAS_H - VISUAL_CONFIG.PLATFORM_H,
        VISUAL_CONFIG.COLORS.TEXT_SUB,
        10,
      );
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
    const stickTip = currentPlatform.right + this.bridge.length;
    const heroFront = this.hero.x + VISUAL_CONFIG.HERO_SIZE;

    // Use actual visual platform positions for collision detection
    const hit = p1 && stickTip >= p1.x && stickTip <= p1.right;
    const hasLanded =
      hit &&
      p1 &&
      heroFront >= p1.x &&
      this.hero.x >=
        p1.right -
          VISUAL_CONFIG.HERO_SIZE -
          VISUAL_CONFIG.HERO_MIN_LANDING_DISTANCE;

    if (!hit && heroFront > stickTip) {
      this.hero.x = stickTip;
      this.phase = "FALLING";
    } else if (hasLanded) {
      const inset = VISUAL_CONFIG.HERO_PLATFORM_INSET;
      const maxX = p1.right - VISUAL_CONFIG.HERO_SIZE - inset;

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
    const pts = isPerfect ? 3 : 1;

    this.score += pts;
    events.push({ type: "score", value: this.score });

    if (isPerfect) {
      if (this.particleSpawn) {
        this.particleSpawn(
          p.center,
          this.hero.y,
          VISUAL_CONFIG.COLORS.BRAND,
          24,
        );
      }
    }

    // Pre-generate next platform so it's visible during scrolling
    const old = this.platforms[1];
    if (old && this.platforms.length < 3) {
      const lastX = old.initialX + old.w;
      const newPlatform = this.generateNextPlatform(lastX, old.index + 1);
      this.platforms.push(newPlatform);
    }

    this.phase = "SCROLLING";
    this.camera.targetX = p.x;
  }

  private advancePlatform() {
    // Platform was already pre-generated in handleSuccess, just shift
    if (this.platforms.length > 1) {
      this.platforms.shift();
    }
    this.bridge.reset();
    this.phase = "IDLE";
    this.idleStartTime = Math.floor(this.engineTimeMs);
  }

  getRenderState(): RenderState {
    // Reuse cached object to avoid allocations every frame
    this.cachedRenderState.phase = this.phase;
    this.cachedRenderState.cameraX = this.camera.x;
    this.cachedRenderState.shakeIntensity = this.camera.shakeIntensity;
    this.cachedRenderState.hero.x = this.hero.x;
    this.cachedRenderState.hero.y = this.hero.y;
    this.cachedRenderState.hero.rotation = this.hero.rotation;
    this.cachedRenderState.stick.length = this.bridge.length;
    this.cachedRenderState.stick.rotation = this.bridge.rotation;
    this.cachedRenderState.score = this.score;

    // Show the third platform only while scrolling
    const visibleCount =
      this.phase === "SCROLLING"
        ? Math.min(3, this.platforms.length)
        : Math.min(2, this.platforms.length);
    if (this.cachedRenderState.platforms.length !== visibleCount) {
      this.cachedRenderState.platforms = new Array(visibleCount);
      for (let i = 0; i < visibleCount; i++) {
        this.cachedRenderState.platforms[i] = { x: 0, w: 0, index: 0 };
      }
    }

    // Update platform values in place
    for (let i = 0; i < visibleCount; i++) {
      const p = this.platforms[i];
      this.cachedRenderState.platforms[i].x = p.x;
      this.cachedRenderState.platforms[i].w = p.w;
      this.cachedRenderState.platforms[i].index = p.index;
    }

    return this.cachedRenderState;
  }
}

export type { EngineEvent, PlatformSnapshot as Platform, RenderState };
