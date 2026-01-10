import { PHYSICS_CONFIG, VISUAL_CONFIG } from "../config";
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
      this.shakeIntensity = Math.max(
        0,
        this.shakeIntensity - dt * PHYSICS_CONFIG.SHAKE_DECAY,
      );
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
  initialVx: number;
  minX: number;
  maxX: number;
  initialX: number; // Store initial position for platform generation

  constructor(
    x: number,
    w: number,
    index: number,
    canMove: boolean,
    rng: () => number,
  ) {
    this.x = x;
    this.w = w;
    this.index = index;
    this.isMoving = false;
    this.vx = 0;
    this.initialVx = 0;
    this.minX = x;
    this.maxX = x;
    this.initialX = x; // Store initial position

    if (canMove && rng() < PHYSICS_CONFIG.PLATFORM_MOVE_CHANCE) {
      this.isMoving = true;
      this.vx = PHYSICS_CONFIG.PLATFORM_MOVE_VELOCITY * (rng() > 0.5 ? 1 : -1);
      this.initialVx = this.vx;
      const range = randomRange(
        rng,
        PHYSICS_CONFIG.PLATFORM_MOVE_MIN_RANGE,
        PHYSICS_CONFIG.PLATFORM_MOVE_MAX_RANGE,
      );
      this.minX = x - range;
      this.maxX = x + range;
    }
  }

  get right() {
    return this.x + this.w;
  }
  get center() {
    return this.x + this.w / 2;
  }

  update(deltaTime: number) {
    if (!this.isMoving) return;
    this.x += this.vx * deltaTime;
    if (this.x < this.minX) {
      this.x = this.minX;
      this.vx *= -1;
    }
    if (this.x > this.maxX) {
      this.x = this.maxX;
      this.vx *= -1;
    }
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
  private streak = 0;
  private hasRevived = false;

  private moves: PlayerMove[] = [];
  private currentPressStart: number | null = null;
  private engineTimeMs = 0;
  private startedAt = 0;
  private idleStartTime = 0;

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
      streak: this.streak,
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
    this.startedAt = performance.now();
    this.moves = [];
    this.currentPressStart = null;
    this.hasRevived = false;
    this.idleStartTime = 0;
    this.engineTimeMs = 0;

    this.platforms = [
      new Platform(0, VISUAL_CONFIG.PLATFORM_START_WIDTH, 0, false, this.rng),
      this.generateNextPlatform(VISUAL_CONFIG.PLATFORM_START_WIDTH, 1),
    ];

    this.hero.resetToPlatform(this.platforms[0]);
    this.bridge.reset();
    this.camera.x = 0;
    this.camera.targetX = 0;
    this.camera.shakeIntensity = 0;

    this.phase = "IDLE";
    this.score = 0;
    this.streak = 0;
  }

  private generateNextPlatform(lastX: number, index: number) {
    const gapRng = this.rng();
    const gap =
      gapRng *
        (VISUAL_CONFIG.PLATFORM_MAX_GAP - VISUAL_CONFIG.PLATFORM_MIN_GAP) +
      VISUAL_CONFIG.PLATFORM_MIN_GAP;

    const widthRng = this.rng();
    const w =
      widthRng *
        (VISUAL_CONFIG.PLATFORM_MAX_WIDTH - VISUAL_CONFIG.PLATFORM_MIN_WIDTH) +
      VISUAL_CONFIG.PLATFORM_MIN_WIDTH;

    const platform = new Platform(lastX + gap, w, index, index > 2, this.rng);

    if (platform.isMoving) {
      const safeMinX = lastX + VISUAL_CONFIG.PLATFORM_MIN_GAP;
      const safeMaxX = platform.initialX + VISUAL_CONFIG.PLATFORM_MIN_GAP;
      platform.minX = Math.max(platform.minX, safeMinX);
      platform.maxX = Math.min(platform.maxX, safeMaxX);
      if (platform.maxX <= platform.minX) {
        platform.isMoving = false;
        platform.vx = 0;
        platform.initialVx = 0;
        platform.minX = platform.initialX;
        platform.maxX = platform.initialX;
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

    const range = platform.maxX - platform.minX;
    if (range <= 0) return platform.initialX;

    const releaseTime = (idleDurationMs + moveDurationMs) / 1000;
    const period = 2 * range;
    const travel =
      platform.initialX - platform.minX + platform.initialVx * releaseTime;
    const mod = ((travel % period) + period) % period;
    if (mod <= range) return platform.minX + mod;
    return platform.maxX - (mod - range);
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
      const platformXAtRelease = this.getPlatformXAtRelease(
        nextPlatform,
        idleDurationMs,
        duration,
      );
      const platformRightAtRelease =
        platformXAtRelease !== null && nextPlatform
          ? platformXAtRelease + nextPlatform.w
          : null;
      const platformCenterAtRelease =
        platformXAtRelease !== null && nextPlatform
          ? platformXAtRelease + nextPlatform.w / 2
          : null;
      this.bridge.length = bridgeLength;
      const stickTip = currentPlatform
        ? currentPlatform.right + bridgeLength
        : null;
      this.moves.push({
        startTime: this.currentPressStart,
        duration: duration,
        idleDurationMs,
        debug: {
          stickTip,
          bridgeLength,
          currentPlatformRight: currentPlatform?.right ?? null,
          nextPlatformIndex: nextPlatform?.index ?? null,
          platformX: platformXAtRelease,
          platformRight: platformRightAtRelease,
          platformCenter: platformCenterAtRelease,
          platformIsMoving: nextPlatform?.isMoving ?? null,
        },
      });
      this.lastMoveDebug = this.moves[this.moves.length - 1]?.debug ?? null;
      this.currentPressStart = null;
    }

    const target = this.platforms[1];
    if (target?.isMoving) {
      const lastDebug = this.lastMoveDebug;
      if (lastDebug?.platformX !== null && lastDebug?.platformX !== undefined) {
        target.x = lastDebug.platformX;
      }
      target.stop();
    }
  }

  step(isPlaying: boolean, dt: number): EngineEvent[] {
    const events: EngineEvent[] = [];
    if (!isPlaying) return events;

    this.engineTimeMs += dt * 1000;

    this.camera.update(dt);

    if (this.phase === "IDLE" || this.phase === "GROWING") {
      this.platforms[1]?.update(dt);
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
        if (Math.abs(this.camera.x - this.camera.targetX) < 1) {
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

    const debug = this.lastMoveDebug;
    const stickTip = debug?.stickTip ?? pCurrent.right + this.bridge.length;
    const platformX = debug?.platformX ?? pNext.x;
    const platformRight = debug?.platformRight ?? pNext.right;
    const platformCenter = debug?.platformCenter ?? pNext.center;
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
      this.streak++;
      events.push({ type: "streak", value: this.streak });
      if (this.particleSpawn) {
        this.particleSpawn(
          p.center,
          this.hero.y,
          VISUAL_CONFIG.COLORS.BRAND,
          24,
        );
      }
    } else {
      this.streak = 0;
    }

    this.phase = "SCROLLING";
    this.camera.targetX = p.x;
  }

  private advancePlatform() {
    const old = this.platforms[1];
    if (old) {
      this.platforms.shift();
      // Use initial position (initialX + width) instead of current position (x + width)
      // This matches backend behavior which uses initial positions for platform generation
      const lastX = old.initialX + old.w;
      const newPlatform = this.generateNextPlatform(lastX, old.index + 1);
      this.platforms.push(newPlatform);
    }
    this.bridge.reset();
    this.phase = "IDLE";
    this.idleStartTime = Math.floor(this.engineTimeMs);
  }

  getRenderState(): RenderState {
    return {
      phase: this.phase,
      cameraX: this.camera.x,
      shakeIntensity: this.camera.shakeIntensity,
      hero: { ...this.hero },
      stick: { length: this.bridge.length, rotation: this.bridge.rotation },
      platforms: this.platforms.map((p) => p.snapshot()),
      score: this.score,
    };
  }
}

export type { EngineEvent, PlatformSnapshot as Platform, RenderState };
