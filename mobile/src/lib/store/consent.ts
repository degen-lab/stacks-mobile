import { create } from "zustand";

import {
  type ConsentDecision,
  type ConsentDto,
  type PendingConsentSync,
} from "@/lib/consent/types";
import { getItem, removeItem, setItem } from "@/lib/storage/storage";

const PENDING_CONSENT_SYNC_KEY = "consent.pendingSync";

interface ConsentStoreState {
  consent: ConsentDto | null;
  pendingSync: PendingConsentSync | null;
  userId: number | null;
  hasHydrated: boolean;
  hydrate: () => Promise<void>;
  applyUserContext: (
    userId: number | null,
    backendConsent: ConsentDto | null,
  ) => Promise<void>;
  setLocalConsent: (userId: number, consent: ConsentDto) => Promise<void>;
  setPendingSync: (
    userId: number,
    payload: ConsentDecision,
    localConsent: ConsentDto,
  ) => Promise<void>;
  clearPendingSync: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useConsentStore = create<ConsentStoreState>((set, get) => ({
  consent: null,
  pendingSync: null,
  userId: null,
  hasHydrated: false,

  hydrate: async () => {
    if (get().hasHydrated) return;

    try {
      const pendingSync = await getItem<PendingConsentSync>(
        PENDING_CONSENT_SYNC_KEY,
      );

      set({
        userId: pendingSync?.userId ?? null,
        consent: pendingSync?.localConsent ?? null,
        pendingSync,
        hasHydrated: true,
      });
    } catch (error) {
      console.error("Failed to hydrate consent store:", error);
      set({ hasHydrated: true });
    }
  },

  applyUserContext: async (userId, backendConsent) => {
    if (userId === null) {
      set({
        userId: null,
        consent: null,
      });
      return;
    }

    const { pendingSync } = get();
    if (pendingSync?.userId === userId) {
      set({
        userId,
        consent: pendingSync.localConsent,
      });
      return;
    }

    set({
      userId,
      consent: backendConsent ?? null,
    });
  },

  setLocalConsent: async (userId, consent) => {
    set({
      userId,
      consent,
    });
  },

  setPendingSync: async (userId, payload, localConsent) => {
    const pendingSync = {
      userId,
      payload,
      localConsent,
    };
    await setItem(PENDING_CONSENT_SYNC_KEY, pendingSync);
    set({
      pendingSync,
      userId,
      consent: localConsent,
    });
  },

  clearPendingSync: async () => {
    await removeItem(PENDING_CONSENT_SYNC_KEY);
    set({
      pendingSync: null,
    });
  },

  reset: async () => {
    await removeItem(PENDING_CONSENT_SYNC_KEY);
    set({
      consent: null,
      pendingSync: null,
      userId: null,
      hasHydrated: true,
    });
  },
}));

export const resetConsentStore = async () => {
  await useConsentStore.getState().reset();
};
