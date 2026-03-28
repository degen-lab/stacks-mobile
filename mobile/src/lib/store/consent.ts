import { create } from "zustand";

import {
  type ConsentDecision,
  type ConsentDto,
  type PendingConsentSync,
} from "@/lib/consent/types";
import { getItem, removeItem, setItem } from "@/lib/storage/storage";

const PENDING_CONSENT_SYNC_KEY = "consent.pendingSync";

interface ConsentStoreState {
  pendingSync: PendingConsentSync | null;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  setPendingSync: (
    userId: number,
    payload: ConsentDecision,
    localConsent: ConsentDto,
  ) => Promise<void>;
  clearPendingSync: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useConsentStore = create<ConsentStoreState>((set, get) => ({
  pendingSync: null,
  hasHydrated: false,

  hydrate: async () => {
    if (get().hasHydrated) return;

    try {
      const pendingSync = await getItem<PendingConsentSync>(
        PENDING_CONSENT_SYNC_KEY,
      );
      set({ pendingSync, hasHydrated: true });
    } catch (error) {
      console.error("Failed to hydrate consent store:", error);
      set({ hasHydrated: true });
    }
  },

  setPendingSync: async (userId, payload, localConsent) => {
    const pendingSync = { userId, payload, localConsent };
    await setItem(PENDING_CONSENT_SYNC_KEY, pendingSync);
    set({ pendingSync });
  },

  clearPendingSync: async () => {
    await removeItem(PENDING_CONSENT_SYNC_KEY);
    set({ pendingSync: null });
  },

  reset: async () => {
    await removeItem(PENDING_CONSENT_SYNC_KEY);
    set({ pendingSync: null, hasHydrated: true });
  },
}));

export const resetConsentStore = async () => {
  await useConsentStore.getState().reset();
};
