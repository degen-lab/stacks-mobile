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

// --- MOCKS SETUP ---

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
  useGameSession: ({
    engine,
    updateScore,
    setOverlay,
    resetPowerUps,
    setRunSummary,
    setPerfectCue,
    resetReviveReward,
    ensureReviveAdLoaded,
  }: any) => ({
    registerUsedItem: jest.fn(),
    startGame: jest.fn(async () => {
      engine.start(12345);
      updateScore(0);
      setOverlay("PLAYING");
      setRunSummary(null);
      resetPowerUps();
      setPerfectCue(null);
      resetReviveReward();
      ensureReviveAdLoaded();
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
  usePowerUpInventory: ({
    onConsumeDropPoint,
    onConsumeRevive,
    registerUsedItem,
  }: any) => ({
    consumeDropPoint: jest.fn(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ItemVariant } = require("@/lib/enums");
      registerUsedItem(ItemVariant.DropPoint);
      onConsumeDropPoint();
    }),
    consumeRevive: jest.fn(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ItemVariant } = require("@/lib/enums");
      mockConsumeRevive();
      registerUsedItem(ItemVariant.Revive);
      onConsumeRevive();
    }),
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

// Mock the Layout component to capture props
jest.mock("../container/BridgeGame.layout", () => ({
  __esModule: true,
  default: (props: Record<string, any>) => {
    mockLayoutProps.current = props;
    return null;
  },
}));

// Mock the Canvas component to capture props and trigger events
jest.mock("../components/canvas", () => ({
  __esModule: true,
  BridgeGameCanvas: (props: Record<string, any>) => {
    mockCanvasProps.current = props;
    return null;
  },
}));

describe("BridgeGame Integration Tests", () => {
  const loadAssets = async () => {
    await act(async () => {
      mockCanvasProps.current?.onAssetsLoaded?.();
    });
  };

  const runEvents = async (events: EngineEvent[]) => {
    await act(async () => {
      if (mockCanvasProps.current?.onEvents) {
        mockCanvasProps.current.onEvents(events);
      } else {
        console.warn("BridgeGameCanvas onEvents prop not found");
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLayoutProps.current = null;
    mockCanvasProps.current = null;

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
    it("should handle input down and up when playing", async () => {
      render(<BridgeGame autoStart={false} />);

      await act(async () => {
        mockLayoutProps.current?.onRestart?.();
      });

      const onInputDown = mockCanvasProps.current?.onInputDown;
      const onInputUp = mockCanvasProps.current?.onInputUp;

      onInputDown();
      expect(mockEngine.handleInputDown).toHaveBeenCalledWith(true);

      onInputUp();
      expect(mockEngine.handleInputUp).toHaveBeenCalledWith(true);
    });

    it("should not handle input when not playing", () => {
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
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      await runEvents([{ type: "score", value: 5 }]);

      expect(mockLayoutProps.current?.score).toBe(5);
    });
  });

  describe("Perfect Landing", () => {
    it("should show perfect cue when perfect event is received", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

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
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      const gameOverEvent: EngineEvent = {
        type: "gameOver",
        value: 10,
        seed: 12345,
        moves: [],
      };

      await runEvents([gameOverEvent]);

      expect(mockLayoutProps.current?.score).toBe(10);
      expect(mockLayoutProps.current?.overlayState).toBe("GAME_OVER");
    });

    it("should auto-revive with power-up on game over", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      await act(async () => {
        mockLayoutProps.current?.onActivateRevive?.();
      });

      const gameOverEvent: EngineEvent = {
        type: "gameOver",
        value: 10,
        seed: 12345,
        moves: [],
      };

      await runEvents([gameOverEvent]);

      expect(mockEngine.revivePowerUp).toHaveBeenCalled();
      expect(mockLayoutProps.current?.overlayState).toBe("PLAYING");
    });

    it("should not auto-revive if power-up is already consumed", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      await act(async () => {
        mockLayoutProps.current?.onActivateRevive?.();
      });
      await act(async () => {
        mockLayoutProps.current?.consumeRevive?.();
      });

      const gameOverEvent: EngineEvent = {
        type: "gameOver",
        value: 10,
        seed: 12345,
        moves: [],
      };

      await runEvents([gameOverEvent]);

      expect(mockEngine.revivePowerUp).not.toHaveBeenCalled();
      expect(mockLayoutProps.current?.overlayState).toBe("GAME_OVER");
    });
  });

  describe("Revive Prompt Flow", () => {
    it("should show revive overlay when revive prompt is received", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      const revivePromptEvent: EngineEvent = {
        type: "revivePrompt",
        value: 8,
      };

      await runEvents([revivePromptEvent]);

      expect(mockLayoutProps.current?.score).toBe(8);
      expect(mockLayoutProps.current?.overlayState).toBe("REVIVE");
    });

    it("should auto-revive with power-up on revive prompt", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      await act(async () => {
        mockLayoutProps.current?.onActivateRevive?.();
      });

      const revivePromptEvent: EngineEvent = {
        type: "revivePrompt",
        value: 8,
      };

      await runEvents([revivePromptEvent]);

      expect(mockEngine.revivePowerUp).toHaveBeenCalled();
      expect(mockLayoutProps.current?.overlayState).toBe("PLAYING");
    });

    it("should handle ad revive flow", () => {
      render(<BridgeGame autoStart={false} />);

      const onRevive = mockLayoutProps.current?.onRevive;
      expect(onRevive).toBeDefined();

      onRevive();

      expect(mockResetReviveReward).toHaveBeenCalled();
      expect(mockReviveAdShowAd).toHaveBeenCalled();
      // Should not call loadAd if ad is already loaded (default mock is loaded=true)
      expect(mockReviveAdLoadAd).not.toHaveBeenCalled();
    });

    it("should handle decline revive flow", async () => {
      mockEngine.state.score = 8;
      // We must mock overlayState being REVIVE for decline to work
      mockGameStore.overlayState = "REVIVE";

      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      // Ensure component sees the REVIVE state
      await act(async () => {
        mockLayoutProps.current?.onDeclineRevive?.();
      });

      // Should transition to GAME_OVER and submit session
      expect(mockLayoutProps.current?.overlayState).toBe("GAME_OVER");
    });
  });

  describe("Game Lifecycle", () => {
    it("should handle restart flow", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      const onRestart = mockLayoutProps.current?.onRestart;
      expect(onRestart).toBeDefined();

      await act(async () => {
        onRestart();
      });

      expect(mockEngine.start).toHaveBeenCalled();
      expect(mockLayoutProps.current?.overlayState).toBe("PLAYING");
    });

    it("should handle exit flow", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      const onExit = mockLayoutProps.current?.onExit;
      expect(onExit).toBeDefined();

      await act(async () => {
        onExit();
      });

      expect(__mockRouter.back).toHaveBeenCalled();
      expect(mockLayoutProps.current?.overlayState).toBe("START");
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
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

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

      act(() => {
        consumeRevive();
      });

      expect(mockConsumeRevive).toHaveBeenCalled();
    });
  });

  describe("Multiple Events", () => {
    it("should handle multiple events in single step", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      const events: EngineEvent[] = [
        { type: "score", value: 5 },
        { type: "perfect", x: 100, y: 200 },
        // particles event doesn't affect React state but shouldn't crash
        { type: "particles", x: 100, y: 200, color: "#ffffff", count: 10 },
      ];

      await runEvents(events);

      expect(mockLayoutProps.current?.score).toBe(5);
      expect(mockCanvasProps.current?.perfectCue).toEqual(
        expect.objectContaining({ x: 100, y: 200 }),
      );
    });

    it("should prioritize game over event in batch", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      const events: EngineEvent[] = [
        { type: "score", value: 10 },
        { type: "gameOver", value: 10, seed: 12345, moves: [] },
      ];

      await runEvents(events);

      expect(mockLayoutProps.current?.overlayState).toBe("GAME_OVER");
      expect(mockLayoutProps.current?.score).toBe(10);
    });
  });

  describe("Ghost Mode", () => {
    it("should show ghost preview when active", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      await act(async () => {
        mockLayoutProps.current?.onActivateGhost?.(performance.now() + 10000);
      });

      expect(mockCanvasProps.current?.showGhostPreview).toBe(true);
    });

    it("should not show ghost preview when expired", async () => {
      render(<BridgeGame autoStart={false} />);
      await loadAssets();

      await act(async () => {
        mockLayoutProps.current?.onActivateGhost?.(performance.now() - 1000);
      });

      expect(mockCanvasProps.current?.showGhostPreview).toBe(false);
    });

    it("should not show ghost preview when not set", () => {
      render(<BridgeGame autoStart={false} />);

      expect(mockCanvasProps.current?.showGhostPreview).toBe(false);
    });
  });
});
