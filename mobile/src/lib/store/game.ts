import { create } from "zustand";
import type { SkinId } from "@/features/play/components/skins/types";
import { getItem, setItem } from "@/lib/storage/storage";

const SELECTED_SKIN_KEY = "selectedSkinId";
const HIGHSCORE_STORAGE_KEY = "bridgeHighscore_v2";

type GameStore = {
  // Only persisted settings
  selectedSkinId: SkinId;
  hasHydratedSelectedSkin: boolean;
  highscore: number;
  hasHydratedHighscore: boolean;

  setSelectedSkinId: (skinId: SkinId) => void;
  hydrateSelectedSkin: () => Promise<void>;
  setHighscore: (score: number) => void;
  hydrateHighscore: () => Promise<void>;
};

export const useGameStore = create<GameStore>((set, get) => ({
  selectedSkinId: "orange",
  hasHydratedSelectedSkin: false,
  highscore: 0,
  hasHydratedHighscore: false,

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
}));
