import { PHYSICS_CONFIG } from "../../config/physics";
import { StacksBridgeEngine } from "../core";

// Mock global __DEV__ for tests if not present
// @ts-ignore
global.__DEV__ = true;

// Helper to track time across steps
class TestTimeKeeper {
  currentTimeMs = 0;

  step(engine: StacksBridgeEngine, isPlaying: boolean, dt: number) {
    // Increment time by dt (converted to ms)
    this.currentTimeMs += dt * 1000;
    return engine.step(isPlaying, dt, this.currentTimeMs);
  }

  reset() {
    this.currentTimeMs = 0;
  }
}

const timeKeeper = new TestTimeKeeper();

const stepUntilEvent = (
  engine: StacksBridgeEngine,
  predicate: (events: ReturnType<StacksBridgeEngine["step"]>) => boolean,
  steps = 300,
  dt = 0.016,
) => {
  for (let i = 0; i < steps; i++) {
    const events = timeKeeper.step(engine, true, dt);
    if (predicate(events)) return events;
  }
  return null;
};

const growForLength = (engine: StacksBridgeEngine, length: number) => {
  const growTime = length / PHYSICS_CONFIG.GROW_SPEED;
  // We perform one large step or multiple small steps.
  // For physics accuracy, multiple small steps is usually better,
  // but for simple logic tests, one step is fine provided logic handles dt correctly.
  timeKeeper.step(engine, true, growTime);
};

const performMoveWithLength = (engine: StacksBridgeEngine, length: number) => {
  engine.handleInputDown(true);
  growForLength(engine, length);
  engine.handleInputUp(true);
};

describe("StacksBridgeEngine", () => {
  let engine: StacksBridgeEngine;

  beforeEach(() => {
    engine = new StacksBridgeEngine();
    timeKeeper.reset();
  });

  describe("Initialization and Start", () => {
    it("should initialize with default state", () => {
      const state = engine.state;
      expect(state.score).toBe(0);
      expect(state.phase).toBe("IDLE");
    });

    it("should require seed to start", () => {
      expect(() => engine.start()).toThrow("start() called without seed");
    });

    it("should start with provided seed", () => {
      expect(() => engine.start(12345)).not.toThrow();
      const state = engine.state;
      expect(state.phase).toBe("IDLE");
      expect(state.score).toBe(0);
    });

    it("should generate platforms on start", () => {
      engine.start(100);
      const renderState = engine.getRenderState();

      // UPDATE: Engine now generates 3 platforms initially for scrolling buffer
      expect(renderState.platforms.length).toBeGreaterThanOrEqual(2);
      expect(renderState.platforms[0].index).toBe(0);
      expect(renderState.platforms[1].index).toBe(1);
    });

    it("should produce same initial platforms with same seed", () => {
      const engine1 = new StacksBridgeEngine();
      const engine2 = new StacksBridgeEngine();

      engine1.start(42);
      engine2.start(42);

      const state1 = engine1.getRenderState();
      const state2 = engine2.getRenderState();

      // Use toBeCloseTo because of float conversion (1/10000)
      expect(state1.platforms[1].x).toBeCloseTo(state2.platforms[1].x);
      expect(state1.platforms[1].w).toBeCloseTo(state2.platforms[1].w);
    });
  });

  describe("Game Phases and Input", () => {
    beforeEach(() => {
      engine.start(123);
    });

    it("should transition from IDLE to GROWING on input down", () => {
      expect(engine.state.phase).toBe("IDLE");
      engine.handleInputDown(true);
      expect(engine.state.phase).toBe("GROWING");
    });

    it("should ignore input down when isPlaying is false", () => {
      engine.handleInputDown(false);
      expect(engine.state.phase).toBe("IDLE");
    });

    it("should transition from GROWING to ROTATING on input up", () => {
      engine.handleInputDown(true);
      expect(engine.state.phase).toBe("GROWING");
      engine.handleInputUp(true);
      expect(engine.state.phase).toBe("ROTATING");
    });

    it("should ignore input up when not in GROWING phase", () => {
      const initialPhase = engine.state.phase;
      engine.handleInputUp(true);
      expect(engine.state.phase).toBe(initialPhase);
    });

    it("should record player moves with correct data", () => {
      engine.handleInputDown(true);
      timeKeeper.step(engine, true, 0.1);
      engine.handleInputUp(true);

      const runData = engine.getRunData();
      expect(runData.moves.length).toBe(1);
      const move = runData.moves[0];
      expect(move.startTime).toBeGreaterThanOrEqual(0);
      expect(move.duration).toBeGreaterThan(0);
      expect(move.idleDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Bridge Growth", () => {
    beforeEach(() => {
      engine.start(456);
    });

    it("should grow bridge while in GROWING phase", () => {
      engine.handleInputDown(true);
      const initialState = engine.getRenderState();
      const initialLength = initialState.stick.length;

      timeKeeper.step(engine, true, 0.1);
      const afterState = engine.getRenderState();

      expect(afterState.stick.length).toBeGreaterThan(initialLength);
    });

    it("should stop growing bridge after input up", () => {
      engine.handleInputDown(true);
      timeKeeper.step(engine, true, 0.1);
      engine.handleInputUp(true);

      const state = engine.getRenderState();
      const bridgeLength = state.stick.length;

      timeKeeper.step(engine, true, 0.1);
      const afterState = engine.getRenderState();

      // Bridge should not grow further in ROTATING phase
      expect(afterState.phase).toBe("ROTATING");
      expect(afterState.stick.length).toBeCloseTo(bridgeLength);
    });
  });

  describe("Bridge Rotation", () => {
    beforeEach(() => {
      engine.start(789);
    });

    it("should rotate bridge during ROTATING phase", () => {
      engine.handleInputDown(true);
      timeKeeper.step(engine, true, 0.05);
      engine.handleInputUp(true);

      const initialRotation = engine.getRenderState().stick.rotation;
      timeKeeper.step(engine, true, 0.1);

      const afterRotation = engine.getRenderState().stick.rotation;
      expect(afterRotation).toBeGreaterThan(initialRotation);
    });

    it("should transition to WALKING when rotation reaches 90", () => {
      engine.handleInputDown(true);
      timeKeeper.step(engine, true, 0.05);
      engine.handleInputUp(true);

      // Step enough times to complete rotation
      for (let i = 0; i < 50; i++) {
        timeKeeper.step(engine, true, 0.05);
        if (engine.state.phase === "WALKING") break;
      }

      expect(engine.state.phase).toBe("WALKING");
      expect(engine.getRenderState().stick.rotation).toBeCloseTo(90);
    });
  });

  describe("Score and Success", () => {
    beforeEach(() => {
      engine.start(111);
    });

    it("should increment score on successful landing", () => {
      const initialScore = engine.state.score;
      expect(initialScore).toBe(0);

      const renderState = engine.getRenderState();
      const platform0 = renderState.platforms[0];
      const platform1 = renderState.platforms[1];
      const gap = platform1.x - (platform0.x + platform0.w);
      const targetLength = gap + platform1.w / 2;

      performMoveWithLength(engine, targetLength);

      const events = stepUntilEvent(engine, (stepEvents) =>
        stepEvents.some((e) => e.type === "score"),
      );

      expect(events).toBeTruthy(); // Not null
      const scoreEvent = events?.find((e) => e.type === "score");
      expect(scoreEvent?.value).toBeGreaterThan(initialScore);
      expect(engine.state.score).toBe(scoreEvent?.value);
    });
  });

  describe("Reset and Replay", () => {
    it("should reset game state", () => {
      engine.start(222);
      engine.handleInputDown(true);
      timeKeeper.step(engine, true, 0.1);

      engine.reset();
      timeKeeper.reset(); // Don't forget to reset test time

      const state = engine.state;
      expect(state.phase).toBe("IDLE");
      expect(state.score).toBe(0);
    });

    it("should use same seed after reset without new seed", () => {
      engine.start(333);
      const firstPlatform = engine.getRenderState().platforms[1];

      engine.reset();
      timeKeeper.reset();
      const resetPlatform = engine.getRenderState().platforms[1];

      expect(resetPlatform.x).toBeCloseTo(firstPlatform.x);
      expect(resetPlatform.w).toBeCloseTo(firstPlatform.w);
    });

    it("should adopt new seed when provided to reset", () => {
      engine.start(444);
      engine.reset(555);
      timeKeeper.reset();

      expect(engine.getRunData().seed).toBe(555);

      const newSeedEngine = new StacksBridgeEngine();
      newSeedEngine.start(555);

      const resetPlatform = engine.getRenderState().platforms[1];
      const expectedPlatform = newSeedEngine.getRenderState().platforms[1];

      expect(resetPlatform.x).toBeCloseTo(expectedPlatform.x);
      expect(resetPlatform.w).toBeCloseTo(expectedPlatform.w);
    });
  });

  describe("Revive", () => {
    beforeEach(() => {
      engine.start(666);
    });

    it("should reset hero position on revive", () => {
      engine.handleInputDown(true);
      timeKeeper.step(engine, true, 0.1);

      const beforeRevive = engine.getRenderState();
      const platform0 = beforeRevive.platforms[0];

      engine.revive();
      const afterRevive = engine.getRenderState();

      expect(afterRevive.phase).toBe("IDLE");
      expect(afterRevive.hero.x).toBeGreaterThan(platform0.x);
      // Use closeTo because of float conversion
      expect(afterRevive.hero.x).toBeLessThanOrEqual(
        platform0.x + platform0.w + 0.001,
      );
      expect(afterRevive.hero.y).toBe(beforeRevive.hero.y);
      expect(afterRevive.stick.length).toBe(0);
    });

    it("should track that player has revived (affects gameOver event)", () => {
      // 1. Score > 0
      const renderState = engine.getRenderState();
      const platform0 = renderState.platforms[0];
      const platform1 = renderState.platforms[1];
      const gap = platform1.x - (platform0.x + platform0.w);
      const targetLength = gap + platform1.w / 2;

      performMoveWithLength(engine, targetLength);
      stepUntilEvent(engine, (events) =>
        events.some((e) => e.type === "score"),
      );

      expect(engine.state.score).toBeGreaterThan(0);

      // 2. Revive
      engine.revive();

      // 3. Fail
      const failLength = Math.max(1, gap / 3);
      performMoveWithLength(engine, failLength);

      const events = stepUntilEvent(engine, (stepEvents) =>
        stepEvents.some(
          (event) => event.type === "gameOver" || event.type === "revivePrompt",
        ),
      );

      const gameOverEvent = events?.find((e) => e.type === "gameOver");
      const revivePromptEvent = events?.find((e) => e.type === "revivePrompt");

      // Should be Game Over because we already revived
      expect(gameOverEvent).toBeDefined();
      expect(revivePromptEvent).toBeUndefined();
    });
  });

  describe("Run Data", () => {
    beforeEach(() => {
      engine.start(777);
    });

    it("should store moves in run data", () => {
      engine.handleInputDown(true);
      timeKeeper.step(engine, true, 0.1);
      engine.handleInputUp(true);

      const runData = engine.getRunData();
      expect(runData.moves.length).toBe(1);
      expect(runData.moves[0]).toHaveProperty("startTime");
    });
  });
});
