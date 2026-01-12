import { act, render } from "@/lib/tests";
import { __mockRouter } from "expo-router";
import BridgeGame from "../container/BridgeGame";
import type { EngineEvent, RenderState, PlayerMove } from "../types";
import { ItemVariant } from "@/lib/enums";

const mockLayoutProps: { current: Record<string, any> | null } = {
  current: null,
};
const mockCanvasProps: { current: Record<string, any> | null } = {
  current: null,
};

const mockEngine = {
  start: jest.fn(),
  reset: jest.fn(),
  revive: jest.fn(),
  revivePowerUp: jest.fn(),
  handleInputDown: jest.fn(),
  handleInputUp: jest.fn(),
  step: jest.fn(() => [] as EngineEvent[]),
  getRenderState: jest.fn(
    () =>
      ({
        phase: "IDLE",
        cameraX: 0,
        shakeIntensity: 0,
        hero: { x: 0, y: 0, rotation: 0 },
        stick: { length: 0, rotation: 0 },
        platforms: [
          { x: 0, w: 80, index: 0 },
          { x: 120, w: 60, index: 1 },
        ],
        score: 0,
      }) as RenderState,
  ),
  getRunData: jest.fn(() => ({ seed: 12345, moves: [] as PlayerMove[] })),
  setParticleEmitter: jest.fn(),
  state: { score: 0, streak: 0, phase: "IDLE" as const },
};

// Mock game store
const mockGameStore = {
  overlayState: "START" as any,
  score: 0,
  highscore: 0,
  ghost: { active: false, expiresAt: null as number | null, used: false },
  revivePowerUp: { activated: false, consumed: false },
  setHighscore: jest.fn(),
  hydrateHighscore: jest.fn(),
  resetSession: jest.fn(),
  setOverlay: jest.fn((state: any) => {
    mockGameStore.overlayState = state;
  }),
  updateScore: jest.fn((score: number) => {
    mockGameStore.score = score;
  }),
  applyEngineEvents: jest.fn(),
  resetPowerUps: jest.fn(),
  consumeRevivePowerUp: jest.fn(),
};

// Mock API hooks
const mockGenerateSeed = jest.fn();
const mockValidateSession = jest.fn();
const mockUserProfile = jest.fn();
const mockTournamentLeaderboard = jest.fn();
const mockTournamentData = jest.fn();
const mockCurrentTournamentSubmissions = jest.fn();
const mockSponsoredSubmissionsLeft = jest.fn();
const mockBroadcastSponsoredTransaction = jest.fn();
const mockGetRunSummary = jest.fn();
const mockSetRunSummary = jest.fn();
const mockResetReviveReward = jest.fn();
const mockReviveAdLoadAd = jest.fn();
const mockReviveAdShowAd = jest.fn();
const mockConsumeRevive = jest.fn();

// Mock hooks
let mockEngineRunnerOnEvents: ((events: EngineEvent[]) => void) | null = null;

jest.mock("../engine", () => ({
  StacksBridgeEngine: jest.fn(() => mockEngine),
}));

jest.mock("@/lib/store/game", () => ({
  useGameStore: (selector: any) => selector(mockGameStore),
}));

jest.mock("@/api/game", () => ({
  useGenerateSeedMutation: () => ({
    mutateAsync: mockGenerateSeed,
  }),
  useValidateSessionMutation: () => ({
    mutateAsync: mockValidateSession,
  }),
}));

jest.mock("@/api/user", () => ({
  useUserProfile: () => mockUserProfile(),
  useSponsoredSubmissionsLeft: () => mockSponsoredSubmissionsLeft(),
}));

jest.mock("@/api/tournament", () => ({
  useTournamentLeaderboard: () => mockTournamentLeaderboard(),
  useTournamentData: () => mockTournamentData(),
  useCurrentTournamentSubmissions: () => mockCurrentTournamentSubmissions(),
}));

jest.mock("@/api/transaction", () => ({
  useBroadcastSponsoredTransactionMutation: () => ({
    mutateAsync: mockBroadcastSponsoredTransaction,
  }),
}));

jest.mock("@/hooks/use-stx-balance", () => ({
  useStxBalance: () => ({ balance: 1000000, isLoading: false }),
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => ({
    userData: { user: { name: "Test User", photo: null } },
  }),
}));

jest.mock("@/lib/store/settings", () => ({
  useSelectedNetwork: () => ({ selectedNetwork: "testnet" }),
}));

jest.mock("../hooks/useEngineRunner", () => ({
  useEngineRunner: ({ onEvents }: any) => {
    mockEngineRunnerOnEvents = onEvents;
  },
}));

// Mock other hooks
jest.mock("../hooks/useAutoStart", () => ({
  useAutoStart: jest.fn(),
}));

jest.mock("../hooks/useBridgeLayout", () => ({
  useBridgeLayout: () => ({
    canvasHeight: 500,
    handleLayout: jest.fn(),
    worldOffsetY: 0,
  }),
}));

jest.mock("../hooks/useGameSession", () => ({
  useGameSession: () => ({
    registerUsedItem: jest.fn(),
    startGame: jest.fn(async () => {
      mockEngine.start(12345);
      mockGameStore.setOverlay("PLAYING");
    }),
    submitSession: jest.fn(),
    cancelPendingStart: jest.fn(),
  }),
}));

jest.mock("../hooks/useGameAds", () => ({
  useGameAds: () => ({
    isWatchingAd: false,
    reviveAd: {
      loaded: true,
      loading: false,
      error: null,
      loadAd: mockReviveAdLoadAd,
      showAd: mockReviveAdShowAd,
    },
    submissionAd: {
      loaded: false,
      loading: false,
      loadAd: jest.fn(),
      showAd: jest.fn(),
    },
    queueSubmissionAd: jest.fn(),
    resetReviveReward: mockResetReviveReward,
    ssvData: null,
  }),
}));

jest.mock("../hooks/usePowerUpInventory", () => ({
  usePowerUpInventory: () => ({
    consumeDropPoint: jest.fn(),
    consumeRevive: mockConsumeRevive,
  }),
}));

jest.mock("../hooks/useRunSummary", () => ({
  useRunSummary: () => ({
    getRunSummary: mockGetRunSummary,
    runSummary: null,
    setRunSummary: mockSetRunSummary,
  }),
}));

jest.mock("../hooks/useSubmissionActions", () => ({
  useSubmissionActions: () => ({
    handleSubmissionSuccess: jest.fn(),
    handleSubmitSponsored: jest.fn(),
    handleSubmitWallet: jest.fn(),
  }),
}));

jest.mock("../hooks/useSubmissionSheet", () => ({
  useSubmissionSheet: () => ({
    submissionContext: null,
    submissionOpenCount: 0,
    submissionSheetRef: { current: null },
    handleSubmissionCancel: jest.fn(),
    handleSubmitLeaderboard: jest.fn(),
    handleSubmitRaffle: jest.fn(),
    rewardAmount: "500 STX",
    showRankChange: true,
    tournamentId: "weekly-tournament",
    tournamentName: "Weekly Tournament",
  }),
}));

jest.mock("../container/BridgeGame.layout", () => ({
  __esModule: true,
  default: (props: Record<string, any>) => {
    mockLayoutProps.current = props;
    return null;
  },
}));

jest.mock("../components/canvas", () => ({
  __esModule: true,
  default: (props: Record<string, any>) => {
    mockCanvasProps.current = props;
    return null;
  },
}));

describe("BridgeGame Integration Tests", () => {
  const runEvents = async (events: EngineEvent[]) => {
    await act(async () => {
      mockEngineRunnerOnEvents!(events);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLayoutProps.current = null;
    mockCanvasProps.current = null;
    mockEngineRunnerOnEvents = null;

    // Reset mock store state
    mockGameStore.overlayState = "START";
    mockGameStore.score = 0;
    mockGameStore.revivePowerUp = { activated: false, consumed: false };

    // Reset engine state
    mockEngine.state = { score: 0, streak: 0, phase: "IDLE" };

    // Setup default API responses
    mockGenerateSeed.mockResolvedValue({
      data: { seed: "0x123456", signature: "sig123" },
    });
    mockValidateSession.mockResolvedValue({
      data: { pointsEarned: 100, sessionScore: 10 },
    });
    mockUserProfile.mockReturnValue({
      data: { items: [], points: 1000 },
    });
    mockTournamentLeaderboard.mockReturnValue({
      data: { userSubmission: { score: 5 }, userPosition: 10 },
    });
    mockTournamentData.mockReturnValue({
      data: { status: "SubmitPhase" },
    });
    mockCurrentTournamentSubmissions.mockReturnValue({
      data: { raffleSubmissionsForCurrentTournament: [] },
    });
    mockSponsoredSubmissionsLeft.mockReturnValue({
      data: {
        dailyWeeklyContestSubmissionsLeft: 5,
        dailyRaffleSubmissionsLeft: 10,
      },
    });
    mockGetRunSummary.mockImplementation((score: number) => ({
      score,
      baseScore: score,
      scoreMultiplier: 1,
      pointsEarned: null,
      isHighScore: false,
      canSubmitLeaderboard: false,
      canSubmitRaffle: false,
    }));
  });

  describe("Game Input Handling", () => {
    it("should handle input down and up when playing", () => {
      mockGameStore.overlayState = "PLAYING";
      render(<BridgeGame autoStart={false} />);

      const onInputDown = mockCanvasProps.current?.onInputDown;
      const onInputUp = mockCanvasProps.current?.onInputUp;

      onInputDown();
      expect(mockEngine.handleInputDown).toHaveBeenCalledWith(true);

      onInputUp();
      expect(mockEngine.handleInputUp).toHaveBeenCalledWith(true);
    });

    it("should not handle input when not playing", () => {
      mockGameStore.overlayState = "GAME_OVER";
      render(<BridgeGame autoStart={false} />);

      const onInputDown = mockCanvasProps.current?.onInputDown;
      const onInputUp = mockCanvasProps.current?.onInputUp;

      onInputDown();
      expect(mockEngine.handleInputDown).toHaveBeenCalledWith(false);

      onInputUp();
      expect(mockEngine.handleInputUp).toHaveBeenCalledWith(false);
    });
  });

  describe("Score Event Handling", () => {
    it("should update score when score event is received", async () => {
      mockGameStore.overlayState = "PLAYING";
      render(<BridgeGame autoStart={false} />);

      expect(mockEngineRunnerOnEvents).not.toBeNull();

      await runEvents([{ type: "score", value: 5 }]);

      expect(mockGameStore.applyEngineEvents).toHaveBeenCalledWith([
        { type: "score", value: 5 },
      ]);
    });
  });

  describe("Perfect Landing", () => {
    it("should show perfect cue when perfect event is received", async () => {
      mockGameStore.overlayState = "PLAYING";
      render(<BridgeGame autoStart={false} />);

      const perfectEvent: EngineEvent = {
        type: "perfect",
        x: 100,
        y: 200,
      };

      await runEvents([perfectEvent]);

      expect(mockCanvasProps.current?.perfectCue).toEqual(
        expect.objectContaining({
          x: 100,
          y: 200,
          createdAt: expect.any(Number),
        }),
      );
    });
  });

  describe("Game Over Flow", () => {
    it("should show game over overlay when game over event is received", async () => {
      mockGameStore.overlayState = "PLAYING";
      render(<BridgeGame autoStart={false} />);

      const gameOverEvent: EngineEvent = {
        type: "gameOver",
        value: 10,
        seed: 12345,
        moves: [],
      };

      await runEvents([gameOverEvent]);

      expect(mockGameStore.updateScore).toHaveBeenCalledWith(10);
      expect(mockGameStore.setOverlay).toHaveBeenCalledWith("GAME_OVER");
    });

    it("should auto-revive with power-up on game over", async () => {
      mockGameStore.overlayState = "GAME_OVER";
      mockGameStore.revivePowerUp = { activated: true, consumed: false };
      render(<BridgeGame autoStart={false} />);

      const gameOverEvent: EngineEvent = {
        type: "gameOver",
        value: 10,
        seed: 12345,
        moves: [],
      };

      await runEvents([gameOverEvent]);

      // Should call revivePowerUp instead of showing game over
      expect(mockEngine.revivePowerUp).toHaveBeenCalled();
      expect(mockGameStore.setOverlay).toHaveBeenCalledWith("PLAYING");
      expect(mockGameStore.updateScore).not.toHaveBeenCalled();
    });

    it("should not auto-revive if power-up is already consumed", async () => {
      mockGameStore.overlayState = "PLAYING";
      mockGameStore.revivePowerUp = { activated: true, consumed: true };
      render(<BridgeGame autoStart={false} />);

      const gameOverEvent: EngineEvent = {
        type: "gameOver",
        value: 10,
        seed: 12345,
        moves: [],
      };

      await runEvents([gameOverEvent]);

      // Should show game over, not revive
      expect(mockEngine.revivePowerUp).not.toHaveBeenCalled();
      expect(mockGameStore.setOverlay).toHaveBeenCalledWith("GAME_OVER");
    });
  });

  describe("Revive Prompt Flow", () => {
    it("should show revive overlay when revive prompt is received", async () => {
      mockGameStore.overlayState = "PLAYING";
      render(<BridgeGame autoStart={false} />);

      const revivePromptEvent: EngineEvent = {
        type: "revivePrompt",
        value: 8,
      };

      await runEvents([revivePromptEvent]);

      expect(mockGameStore.updateScore).toHaveBeenCalledWith(8);
      expect(mockGameStore.setOverlay).toHaveBeenCalledWith("REVIVE");
    });

    it("should auto-revive with power-up on revive prompt", async () => {
      mockGameStore.overlayState = "REVIVE";
      mockGameStore.revivePowerUp = { activated: true, consumed: false };
      render(<BridgeGame autoStart={false} />);

      const revivePromptEvent: EngineEvent = {
        type: "revivePrompt",
        value: 8,
      };

      await runEvents([revivePromptEvent]);

      // Should call revivePowerUp instead of showing revive prompt
      expect(mockEngine.revivePowerUp).toHaveBeenCalled();
      expect(mockGameStore.setOverlay).toHaveBeenCalledWith("PLAYING");
      expect(mockGameStore.setOverlay).not.toHaveBeenCalledWith("REVIVE");
    });

    it("should handle ad revive flow", () => {
      mockGameStore.overlayState = "REVIVE";
      render(<BridgeGame autoStart={false} />);

      const onRevive = mockLayoutProps.current?.onRevive;
      expect(onRevive).toBeDefined();

      // User clicks revive button - should trigger ad
      onRevive();

      expect(mockResetReviveReward).toHaveBeenCalled();
      expect(mockReviveAdShowAd).toHaveBeenCalled();
      expect(mockReviveAdLoadAd).not.toHaveBeenCalled();
    });

    it("should handle decline revive flow", () => {
      mockGameStore.overlayState = "REVIVE";
      mockEngine.state.score = 8;
      mockEngine.getRunData.mockReturnValue({
        seed: 12345,
        moves: [{ startTime: 0, duration: 100, idleDurationMs: 0 }],
      });
      render(<BridgeGame autoStart={false} />);

      const onDeclineRevive = mockLayoutProps.current?.onDeclineRevive;
      expect(onDeclineRevive).toBeDefined();

      onDeclineRevive();

      // Should transition to game over
      expect(mockGameStore.updateScore).toHaveBeenCalledWith(8);
      expect(mockGameStore.setOverlay).toHaveBeenCalledWith("GAME_OVER");
    });
  });

  describe("Game Lifecycle", () => {
    it("should handle restart flow", () => {
      mockGameStore.overlayState = "GAME_OVER";
      render(<BridgeGame autoStart={false} />);

      const onRestart = mockLayoutProps.current?.onRestart;
      expect(onRestart).toBeDefined();

      onRestart();

      expect(mockGameStore.resetSession).toHaveBeenCalled();
    });

    it("should handle exit flow", () => {
      mockGameStore.overlayState = "GAME_OVER";
      render(<BridgeGame autoStart={false} />);

      const onExit = mockLayoutProps.current?.onExit;
      expect(onExit).toBeDefined();

      onExit();

      expect(mockGameStore.resetSession).toHaveBeenCalled();
      expect(__mockRouter.back).toHaveBeenCalled();
    });

    it("should set particle emitter when canvas is ready", () => {
      render(<BridgeGame autoStart={false} />);

      const onEmitterReady = mockCanvasProps.current?.onEmitterReady;
      expect(onEmitterReady).toBeDefined();

      const mockSpawn = jest.fn();
      onEmitterReady(mockSpawn);

      expect(mockEngine.setParticleEmitter).toHaveBeenCalledWith(mockSpawn);
    });
  });

  describe("Submission Flow", () => {
    it("should pass submission callbacks to layout", () => {
      render(<BridgeGame autoStart={false} />);

      expect(mockLayoutProps.current?.onSubmitToLeaderboard).toBeDefined();
      expect(mockLayoutProps.current?.onSubmitToRaffle).toBeDefined();
    });

    it("should compute run summary on game over", async () => {
      mockGameStore.overlayState = "PLAYING";
      render(<BridgeGame autoStart={false} />);

      const gameOverEvent: EngineEvent = {
        type: "gameOver",
        value: 15,
        seed: 12345,
        moves: [],
      };

      await runEvents([gameOverEvent]);

      expect(mockGetRunSummary).toHaveBeenCalledWith(15, [], true);
      const summary = mockGetRunSummary.mock.results[0]?.value;
      expect(mockSetRunSummary).toHaveBeenCalledWith(summary);
    });
  });

  describe("Power-Ups", () => {
    it("should pass power-up availability to layout", () => {
      mockUserProfile.mockReturnValue({
        data: {
          items: [
            {
              id: 1,
              type: 0,
              name: "Revive",
              purchaseType: 0,
              metadata: { variant: ItemVariant.Revive },
              quantity: 2,
            },
            {
              id: 2,
              type: 0,
              name: "Drop Point",
              purchaseType: 0,
              metadata: { variant: ItemVariant.DropPoint },
              quantity: 1,
            },
          ],
          points: 1000,
        },
      });
      render(<BridgeGame autoStart={false} />);

      expect(mockLayoutProps.current?.reviveAvailable).toBe(true);
      expect(mockLayoutProps.current?.dropPointAvailable).toBe(true);
    });

    it("should detect no available power-ups", () => {
      mockUserProfile.mockReturnValue({
        data: {
          items: [],
          points: 1000,
        },
      });
      render(<BridgeGame autoStart={false} />);

      expect(mockLayoutProps.current?.reviveAvailable).toBe(false);
      expect(mockLayoutProps.current?.dropPointAvailable).toBe(false);
    });

    it("should handle power-up consumption", () => {
      mockUserProfile.mockReturnValue({
        data: {
          items: [
            {
              id: 1,
              type: 0,
              name: "Revive",
              purchaseType: 0,
              metadata: { variant: ItemVariant.Revive },
              quantity: 1,
            },
          ],
          points: 1000,
        },
      });
      render(<BridgeGame autoStart={false} />);

      const consumeRevive = mockLayoutProps.current?.consumeRevive;
      expect(consumeRevive).toBeDefined();

      consumeRevive();

      expect(mockConsumeRevive).toHaveBeenCalled();
    });
  });

  describe("Multiple Events", () => {
    it("should handle multiple events in single step", async () => {
      mockGameStore.overlayState = "PLAYING";
      render(<BridgeGame autoStart={false} />);

      const events: EngineEvent[] = [
        { type: "score", value: 5 },
        { type: "perfect", x: 100, y: 200 },
        { type: "particles", x: 100, y: 200, color: "#ffffff", count: 10 },
      ];

      await runEvents(events);

      expect(mockGameStore.applyEngineEvents).toHaveBeenCalledWith(events);
    });

    it("should prioritize game over event in batch", async () => {
      mockGameStore.overlayState = "PLAYING";
      render(<BridgeGame autoStart={false} />);

      const events: EngineEvent[] = [
        { type: "score", value: 10 },
        { type: "gameOver", value: 10, seed: 12345, moves: [] },
      ];

      await runEvents(events);

      expect(mockGameStore.setOverlay).toHaveBeenCalledWith("GAME_OVER");
    });
  });

  describe("Ghost Mode", () => {
    it("should show ghost preview when active", () => {
      mockGameStore.ghost = {
        active: true,
        expiresAt: performance.now() + 10000,
        used: true,
      };
      render(<BridgeGame autoStart={false} />);

      expect(mockCanvasProps.current?.showGhostPreview).toBe(true);
    });

    it("should not show ghost preview when expired", () => {
      mockGameStore.ghost = {
        active: false,
        expiresAt: performance.now() - 1000,
        used: false,
      };
      render(<BridgeGame autoStart={false} />);

      expect(mockCanvasProps.current?.showGhostPreview).toBe(false);
    });

    it("should not show ghost preview when not set", () => {
      mockGameStore.ghost = { active: false, expiresAt: null, used: false };
      render(<BridgeGame autoStart={false} />);

      expect(mockCanvasProps.current?.showGhostPreview).toBe(false);
    });
  });
});
