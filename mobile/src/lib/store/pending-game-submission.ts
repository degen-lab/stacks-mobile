import { create } from "zustand";

export const PENDING_GAME_SUBMISSION_TTL_MS = 5 * 60_000;

type PendingGameSubmission = {
  baselineCount: number;
  createdAt: number;
};

type PendingGameSubmissionStore = {
  pendingSubmission: PendingGameSubmission | null;
  markPendingSubmission: (baselineCount: number) => void;
  clearPendingSubmission: () => void;
};

export const usePendingGameSubmissionStore = create<PendingGameSubmissionStore>(
  (set) => ({
    pendingSubmission: null,
    markPendingSubmission: (baselineCount) =>
      set({
        pendingSubmission: {
          baselineCount,
          createdAt: Date.now(),
        },
      }),
    clearPendingSubmission: () => set({ pendingSubmission: null }),
  }),
);
