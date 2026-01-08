import type { SkinId } from "@/features/play/types/skin";
import { getItem, setItem } from "@/lib/storage/storage";
import { create } from "zustand";

interface GameState {
  selectedSkinId: SkinId;
  setSelectedSkinId: (skinId: SkinId) => void;
  hydrateSelectedSkin: () => Promise<void>;
  hasHydratedSelectedSkin: boolean;
  highscore: number;
  setHighscore: (score: number) => void;
  hydrateHighscore: () => Promise<void>;
  hasHydratedHighscore: boolean;
  lastRunBaseScore: number | null;
  lastRunWasHighscore: boolean;
  setLastRunSummary: (score: number, isHighscore: boolean) => void;
}

const SELECTED_SKIN_KEY = "selectedSkinId";
const HIGHSCORE_STORAGE_KEY = "bridgeHighscore_v2";

export const useGameStore = create<GameState>((set, get) => ({
  selectedSkinId: "orange", // Default to orange
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
  hasHydratedSelectedSkin: false,
  highscore: 0,
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
  hasHydratedHighscore: false,
  lastRunBaseScore: null,
  lastRunWasHighscore: false,
  setLastRunSummary: (score: number, isHighscore: boolean) => {
    set({ lastRunBaseScore: score, lastRunWasHighscore: isHighscore });
  },
}));
