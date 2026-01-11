import { PHYSICS_CONFIG } from "../../config/physics";
import { StacksBridgeEngine } from "../core";

const stepUntilEvent = (
  engine: StacksBridgeEngine,
  predicate: (events: ReturnType<StacksBridgeEngine["step"]>) => boolean,
  steps = 300,
  dt = 0.016,
) => {
  for (let i = 0; i < steps; i++) {
    const events = engine.step(true, dt);
    if (predicate(events)) return events;
  }
  return null;
};

const growForLength = (engine: StacksBridgeEngine, length: number) => {
  const growTime = length / PHYSICS_CONFIG.GROW_SPEED;
  engine.step(true, growTime);
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
  });

  describe("Initialization and Start", () => {
    it("should initialize with default state", () => {
      const state = engine.state;
      expect(state.score).toBe(0);
      expect(state.phase).toBe("IDLE");
    });

    it("should require seed to start", () => {
      expect(() => engine.start()).toThrow(
        "start() must be called with a seed",
      );
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
      expect(renderState.platforms.length).toBe(2);
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

      expect(state1.platforms[1].x).toBe(state2.platforms[1].x);
      expect(state1.platforms[1].w).toBe(state2.platforms[1].w);
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
      engine.step(true, 0.1);
      engine.handleInputUp(true);

      const runData = engine.getRunData();
      expect(runData.moves.length).toBe(1);
      const move = runData.moves[0];
      expect(move.startTime).toBeGreaterThanOrEqual(0);
      expect(move.duration).toBeGreaterThan(0);
      expect(move.idleDurationMs).toBeGreaterThanOrEqual(0);
      expect(typeof move.startTime).toBe("number");
      expect(typeof move.duration).toBe("number");
      expect(typeof move.idleDurationMs).toBe("number");
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

      engine.step(true, 0.1);
      const afterState = engine.getRenderState();

      expect(afterState.stick.length).toBeGreaterThan(initialLength);
    });

    it("should stop growing bridge after input up", () => {
      engine.handleInputDown(true);
      engine.step(true, 0.1);
      engine.handleInputUp(true);

      const state = engine.getRenderState();
      const bridgeLength = state.stick.length;

      engine.step(true, 0.1);
      const afterState = engine.getRenderState();

      // Bridge should not grow further in ROTATING phase
      expect(afterState.phase).toBe("ROTATING");
      expect(afterState.stick.length).toBe(bridgeLength);
    });
  });

  describe("Bridge Rotation", () => {
    beforeEach(() => {
      engine.start(789);
    });

    it("should rotate bridge during ROTATING phase", () => {
      engine.handleInputDown(true);
      engine.step(true, 0.05);
      engine.handleInputUp(true);

      const initialRotation = engine.getRenderState().stick.rotation;
      engine.step(true, 0.1);

      const afterRotation = engine.getRenderState().stick.rotation;
      expect(afterRotation).toBeGreaterThan(initialRotation);
    });

    it("should transition to WALKING when rotation reaches 90", () => {
      engine.handleInputDown(true);
      engine.step(true, 0.05);
      engine.handleInputUp(true);

      // Step enough times to complete rotation
      for (let i = 0; i < 10; i++) {
        engine.step(true, 0.1);
        if (engine.state.phase === "WALKING") break;
      }

      expect(engine.state.phase).toBe("WALKING");
      expect(engine.getRenderState().stick.rotation).toBe(90);
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
      expect(events).not.toBeNull();
      const scoreEvent = events?.find((e) => e.type === "score");
      expect(scoreEvent?.value).toBeGreaterThan(initialScore);
      expect(engine.state.score).toBe(scoreEvent?.value);
    });

    it("should emit perfect event when bridge tip lands at platform center", () => {
      const renderState = engine.getRenderState();
      const platform0 = renderState.platforms[0];
      const platform1 = renderState.platforms[1];
      const gap = platform1.x - (platform0.x + platform0.w);
      const targetLength = gap + platform1.w / 2;

      performMoveWithLength(engine, targetLength);

      const events = stepUntilEvent(engine, (stepEvents) =>
        stepEvents.some((e) => e.type === "perfect"),
      );

      expect(events).not.toBeNull();
      const perfectEvent = events?.find((e) => e.type === "perfect");
      expect(perfectEvent).toBeDefined();
    });
  });

  describe("Reset and Replay", () => {
    it("should reset game state", () => {
      engine.start(222);
      engine.handleInputDown(true);
      engine.step(true, 0.1);

      engine.reset();

      const state = engine.state;
      expect(state.phase).toBe("IDLE");
      expect(state.score).toBe(0);
    });

    it("should use same seed after reset without new seed", () => {
      engine.start(333);
      const firstPlatform = engine.getRenderState().platforms[1];

      engine.reset();
      const resetPlatform = engine.getRenderState().platforms[1];

      expect(resetPlatform.x).toBe(firstPlatform.x);
      expect(resetPlatform.w).toBe(firstPlatform.w);
    });

    it("should adopt new seed when provided to reset", () => {
      engine.start(444);
      engine.reset(555);
      expect(engine.getRunData().seed).toBe(555);

      const newSeedEngine = new StacksBridgeEngine();
      newSeedEngine.start(555);
      const resetPlatform = engine.getRenderState().platforms[1];
      const expectedPlatform = newSeedEngine.getRenderState().platforms[1];
      expect(resetPlatform.x).toBe(expectedPlatform.x);
      expect(resetPlatform.w).toBe(expectedPlatform.w);
    });
  });

  describe("Revive", () => {
    beforeEach(() => {
      engine.start(666);
    });

    it("should reset hero position on revive", () => {
      engine.handleInputDown(true);
      engine.step(true, 0.1);

      const beforeRevive = engine.getRenderState();
      const platform0 = beforeRevive.platforms[0];

      engine.revive();
      const afterRevive = engine.getRenderState();

      expect(afterRevive.phase).toBe("IDLE");
      expect(afterRevive.hero.x).toBeGreaterThan(platform0.x);
      expect(afterRevive.hero.x).toBeLessThanOrEqual(platform0.x + platform0.w);
      expect(afterRevive.hero.y).toBe(beforeRevive.hero.y);
      expect(afterRevive.hero.rotation).toBe(0);
      expect(afterRevive.stick.length).toBe(0);
      expect(afterRevive.stick.rotation).toBe(0);
    });

    it("should track that player has revived (affects gameOver event)", () => {
      // First, get a score > 0 by completing a successful landing
      const renderState = engine.getRenderState();
      const platform0 = renderState.platforms[0];
      const platform1 = renderState.platforms[1];
      const gap = platform1.x - (platform0.x + platform0.w);
      const targetLength = gap + platform1.w / 2;

      performMoveWithLength(engine, targetLength);

      // Complete a successful move to get score > 0
      stepUntilEvent(engine, (events) =>
        events.some((e) => e.type === "score"),
      );

      expect(engine.state.score).toBeGreaterThan(0);

      // Revive sets hasRevived = true
      engine.revive();
      expect(engine.state.phase).toBe("IDLE");

      // Now trigger a fall - should show gameOver (not revivePrompt) since hasRevived is true
      // Make a move that will miss (very short bridge)
      const failLength = Math.max(1, gap / 3);
      performMoveWithLength(engine, failLength);

      // Step until falling and then until gameOver
      const events = stepUntilEvent(engine, (stepEvents) =>
        stepEvents.some(
          (event) => event.type === "gameOver" || event.type === "revivePrompt",
        ),
      );
      const gameOverEvent = events?.find((e) => e.type === "gameOver") ?? null;
      const revivePromptEvent =
        events?.find((e) => e.type === "revivePrompt") ?? null;

      // After revive(), should get gameOver (not revivePrompt) even with score > 0
      expect(gameOverEvent).not.toBeNull();
      expect(revivePromptEvent).toBeNull();
    });

    it("should not affect revive flag with revivePowerUp (allows revivePrompt again)", () => {
      // First, get a score > 0 by completing a successful landing
      const renderState = engine.getRenderState();
      const platform0 = renderState.platforms[0];
      const platform1 = renderState.platforms[1];
      const gap = platform1.x - (platform0.x + platform0.w);
      const targetLength = gap + platform1.w / 2;

      performMoveWithLength(engine, targetLength);

      // Complete a successful move to get score > 0
      stepUntilEvent(engine, (events) =>
        events.some((e) => e.type === "score"),
      );

      expect(engine.state.score).toBeGreaterThan(0);

      // revivePowerUp does NOT set hasRevived (it stays false)
      engine.revivePowerUp();
      expect(engine.state.phase).toBe("IDLE");

      // Now trigger a fall - should show revivePrompt (not gameOver) since hasRevived is still false
      // Make a move that will miss (very short bridge)
      const failLength = Math.max(1, gap / 3);
      performMoveWithLength(engine, failLength);

      // Step until falling and then until revivePrompt or gameOver
      const events = stepUntilEvent(engine, (stepEvents) =>
        stepEvents.some(
          (event) => event.type === "revivePrompt" || event.type === "gameOver",
        ),
      );
      const revivePromptEvent =
        events?.find((e) => e.type === "revivePrompt") ?? null;
      const gameOverEvent = events?.find((e) => e.type === "gameOver") ?? null;

      // After revivePowerUp(), should get revivePrompt (not gameOver) because hasRevived is still false
      expect(revivePromptEvent).not.toBeNull();
      expect(gameOverEvent).toBeNull();
    });
  });

  describe("Deterministic Gameplay", () => {
    it("should produce identical results with same seed and inputs", () => {
      const engine1 = new StacksBridgeEngine();
      const engine2 = new StacksBridgeEngine();
      const seed = 999;

      engine1.start(seed);
      engine2.start(seed);

      // Perform identical actions
      const actions = [
        { type: "down" as const, delay: 0.1 },
        { type: "step" as const, delay: 0.15 },
        { type: "up" as const, delay: 0.1 },
      ];

      actions.forEach((action) => {
        if (action.type === "down") {
          engine1.handleInputDown(true);
          engine2.handleInputDown(true);
        } else if (action.type === "up") {
          engine1.handleInputUp(true);
          engine2.handleInputUp(true);
        } else if (action.type === "step") {
          engine1.step(true, action.delay);
          engine2.step(true, action.delay);
        }
      });

      const state1 = engine1.getRenderState();
      const state2 = engine2.getRenderState();

      expect(state1.hero.x).toBe(state2.hero.x);
      expect(state1.stick.length).toBe(state2.stick.length);
      expect(state1.platforms[0].x).toBe(state2.platforms[0].x);
    });
  });

  describe("Run Data", () => {
    beforeEach(() => {
      engine.start(777);
    });

    it("should store seed in run data", () => {
      const runData = engine.getRunData();
      expect(runData.seed).toBe(777);
    });

    it("should store moves in run data", () => {
      engine.handleInputDown(true);
      engine.step(true, 0.1);
      engine.handleInputUp(true);

      const runData = engine.getRunData();
      expect(runData.moves.length).toBe(1);
      expect(runData.moves[0]).toHaveProperty("startTime");
      expect(runData.moves[0]).toHaveProperty("duration");
      expect(runData.moves[0]).toHaveProperty("idleDurationMs");
    });

    it("should include debug info in moves only in development mode", () => {
      engine.handleInputDown(true);
      engine.step(true, 0.1);
      engine.handleInputUp(true);

      const runData = engine.getRunData();
      const isDev = typeof __DEV__ !== "undefined" && __DEV__;
      if (isDev) {
        expect(runData.moves[0].debug).toBeDefined();
        expect(runData.moves[0].debug?.stickTip).not.toBeNull();
        expect(runData.moves[0].debug?.bridgeLength).not.toBeNull();
      } else {
        expect(runData.moves[0].debug).toBeUndefined();
      }
    });
  });
});
