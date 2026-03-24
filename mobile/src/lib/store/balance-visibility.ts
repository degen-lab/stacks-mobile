import { create } from "zustand";

import { getItem, setItem } from "@/lib/storage/storage";

const BALANCE_VISIBILITY_KEY = "settings.balanceVisible";

type BalanceVisibilityState = {
  isBalanceVisible: boolean;
  hasHydrated: boolean;
  setBalanceVisible: (isVisible: boolean) => Promise<void>;
  toggleBalanceVisibility: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useBalanceVisibilityStore = create<BalanceVisibilityState>(
  (set, get) => ({
    isBalanceVisible: true,
    hasHydrated: false,
    setBalanceVisible: async (isVisible) => {
      set({ isBalanceVisible: isVisible });
      try {
        await setItem(BALANCE_VISIBILITY_KEY, isVisible);
      } catch (error) {
        console.error("Failed to save balance visibility:", error);
      }
    },
    toggleBalanceVisibility: async () => {
      const nextValue = !get().isBalanceVisible;
      await get().setBalanceVisible(nextValue);
    },
    hydrate: async () => {
      if (get().hasHydrated) return;
      try {
        const storedValue = await getItem<boolean>(BALANCE_VISIBILITY_KEY);
        set({
          isBalanceVisible:
            typeof storedValue === "boolean" ? storedValue : true,
          hasHydrated: true,
        });
      } catch (error) {
        console.error("Failed to hydrate balance visibility:", error);
        set({ hasHydrated: true });
      }
    },
  }),
);

export const loadBalanceVisibility = async () => {
  await useBalanceVisibilityStore.getState().hydrate();
};

export const useBalanceVisibility = () => {
  const isBalanceVisible = useBalanceVisibilityStore(
    (state) => state.isBalanceVisible,
  );
  const toggleBalanceVisibility = useBalanceVisibilityStore(
    (state) => state.toggleBalanceVisibility,
  );
  const setBalanceVisible = useBalanceVisibilityStore(
    (state) => state.setBalanceVisible,
  );

  return {
    isBalanceVisible,
    toggleBalanceVisibility,
    setBalanceVisible,
  } as const;
};
