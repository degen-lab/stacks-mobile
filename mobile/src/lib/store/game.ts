import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { SkinId } from "@/features/play/components/skins/types";
import type { EngineEvent } from "@/features/game/types";
import { getItem, setItem } from "@/lib/storage/storage";

export type BridgeOverlayState = "START" | "PLAYING" | "REVIVE" | "GAME_OVER";

export type ReviveState =
  | { type: "available" }
  | { type: "powerUpUsed" }
  | { type: "adUsed" }
  | { type: "exhausted" };

export type AdState =
  | { flow: "none" }
  | { flow: "revive"; status: "loading" | "showing" | "completed" }
  | { flow: "submission"; status: "loading" | "showing" | "completed" };

export type SkinState = {
  selectedSkinId: SkinId;
  hasHydratedSelectedSkin: boolean;
};

export type HighscoreState = {
  highscore: number;
  hasHydratedHighscore: boolean;
};

export type BridgeGameStoreState = {
  // Persisted settings
  selectedSkinId: SkinState["selectedSkinId"];
  hasHydratedSelectedSkin: SkinState["hasHydratedSelectedSkin"];
  highscore: HighscoreState["highscore"];
  hasHydratedHighscore: HighscoreState["hasHydratedHighscore"];

  // Runtime session state
  score: number;
  distance: number;
  perfectCount: number;
  overlayState: BridgeOverlayState;
  ghost: {
    active: boolean;
    expiresAt: number | null;
    used: boolean;
  };
  revivePowerUp: {
    activated: boolean;
    consumed: boolean;
  };
  reviveFlow: ReviveState;
  adState: AdState;
};

export type BridgeGameStoreActions = {
  setSelectedSkinId: (skinId: SkinId) => void;
  hydrateSelectedSkin: () => Promise<void>;
  setHighscore: (score: number) => void;
  hydrateHighscore: () => Promise<void>;
  resetSession: () => void;

  updateScore: (score: number) => void;
  updateDistance: (distance: number) => void;
  incrementPerfect: () => void;
  setOverlay: (state: BridgeOverlayState) => void;
  activateGhost: (expiresAt: number) => void;
  deactivateGhost: () => void;
  resetPowerUps: () => void;
  activateRevivePowerUp: () => void;
  consumeRevivePowerUp: () => void;
  markAdReviveUsed: () => void;
  setAdState: (next: AdState) => void;
  applyEngineEvents: (events: EngineEvent[]) => void;
};

export type BridgeGameStore = BridgeGameStoreState & BridgeGameStoreActions;

const initialReviveFlow: ReviveState = { type: "available" };
const initialAdState: AdState = { flow: "none" };

const SELECTED_SKIN_KEY = "selectedSkinId";
const HIGHSCORE_STORAGE_KEY = "bridgeHighscore_v2";

const persistedInitialState = {
  selectedSkinId: "orange",
  hasHydratedSelectedSkin: false,
  highscore: 0,
  hasHydratedHighscore: false,
};

const runtimeInitialState = {
  score: 0,
  distance: 0,
  perfectCount: 0,
  overlayState: "START" as BridgeOverlayState,
  ghost: {
    active: false,
    expiresAt: null,
    used: false,
  },
  revivePowerUp: {
    activated: false,
    consumed: false,
  },
  reviveFlow: initialReviveFlow,
  adState: initialAdState,
};

const initialState: BridgeGameStoreState = {
  ...persistedInitialState,
  ...runtimeInitialState,
};

const transitionReviveFlow = (
  current: ReviveState,
  action: "powerUp" | "ad",
) => {
  if (action === "powerUp") {
    if (current.type === "available") return { type: "powerUpUsed" } as const;
    if (current.type === "powerUpUsed") return current;
    return { type: "exhausted" } as const;
  }

  if (current.type === "available" || current.type === "powerUpUsed") {
    return { type: "adUsed" } as const;
  }
  if (current.type === "adUsed") return { type: "exhausted" } as const;
  return current;
};

export const useGameStore = create<BridgeGameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    setSelectedSkinId: (skinId: SkinId) => {
      set({ selectedSkinId: skinId });
      void setItem(SELECTED_SKIN_KEY, skinId);
    },
    hydrateSelectedSkin: async () => {
      if (get().hasHydratedSelectedSkin) return;
      const stored = await getItem<SkinId>(SELECTED_SKIN_KEY);
      if (stored) {
        set({ selectedSkinId: stored });
      }
      set({ hasHydratedSelectedSkin: true });
    },
    setHighscore: (score: number) => {
      const currentHighscore = get().highscore;
      if (score <= currentHighscore) return;
      set({ highscore: score });
      void setItem(HIGHSCORE_STORAGE_KEY, score);
    },
    hydrateHighscore: async () => {
      if (get().hasHydratedHighscore) return;
      const stored = await getItem<number>(HIGHSCORE_STORAGE_KEY);
      if (stored !== null && typeof stored === "number") {
        set({ highscore: stored });
      }
      set({ hasHydratedHighscore: true });
    },
    resetSession: () => set(() => ({ ...runtimeInitialState })),
    updateScore: (score) => set({ score }),
    updateDistance: (distance) => set({ distance }),
    incrementPerfect: () =>
      set((state) => ({ perfectCount: state.perfectCount + 1 })),
    setOverlay: (overlayState: BridgeOverlayState) => set({ overlayState }),
    activateGhost: (expiresAt) =>
      set((state) => ({
        ghost: {
          ...state.ghost,
          active: true,
          expiresAt,
          used: true,
        },
      })),
    deactivateGhost: () =>
      set((state) => ({
        ghost: {
          ...state.ghost,
          active: false,
        },
      })),
    resetPowerUps: () =>
      set(() => ({
        ghost: {
          active: false,
          expiresAt: null,
          used: false,
        },
        revivePowerUp: {
          activated: false,
          consumed: false,
        },
      })),
    activateRevivePowerUp: () =>
      set((state) => ({
        revivePowerUp: {
          ...state.revivePowerUp,
          activated: true,
        },
      })),
    consumeRevivePowerUp: () =>
      set((state) => ({
        revivePowerUp: {
          ...state.revivePowerUp,
          consumed: true,
        },
        reviveFlow: transitionReviveFlow(state.reviveFlow, "powerUp"),
      })),
    markAdReviveUsed: () =>
      set((state) => ({
        reviveFlow: transitionReviveFlow(state.reviveFlow, "ad"),
      })),
    setAdState: (adState) => set({ adState }),
    applyEngineEvents: (events: EngineEvent[]) => {
      if (!events.length) return;
      let nextScore: number | null = null;
      let perfectIncrement = 0;
      for (const event of events) {
        if (event.type === "score") {
          nextScore = event.value;
        } else if (event.type === "perfect") {
          perfectIncrement += 1;
        }
      }
      if (nextScore === null && perfectIncrement === 0) return;
      set((state) => ({
        score: nextScore ?? state.score,
        perfectCount:
          perfectIncrement > 0
            ? state.perfectCount + perfectIncrement
            : state.perfectCount,
      }));
    },
  })),
);

export const useScore = () => useGameStore((state) => state.score);
export const useDistance = () => useGameStore((state) => state.distance);
export const useGhost = () => useGameStore((state) => state.ghost);
export const useOverlayState = () =>
  useGameStore((state) => state.overlayState);
export const usePowerUpActions = () =>
  useGameStore((state) => ({
    activateGhost: state.activateGhost,
    deactivateGhost: state.deactivateGhost,
    resetPowerUps: state.resetPowerUps,
    activateRevivePowerUp: state.activateRevivePowerUp,
    consumeRevivePowerUp: state.consumeRevivePowerUp,
  }));
export const useAdState = () => useGameStore((state) => state.adState);
export const useReviveFlow = () => useGameStore((state) => state.reviveFlow);
