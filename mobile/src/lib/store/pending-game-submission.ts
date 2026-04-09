import { create } from "zustand";

export const PENDING_GAME_SUBMISSION_TTL_MS = 5 * 60_000;

export type PendingGameSubmissionKind = "tournament" | "raffle";

type PendingGameSubmission = {
  baselineCount: number;
  submissionKind: PendingGameSubmissionKind;
  createdAt: number;
};

type PendingGameSubmissionStore = {
  pendingSubmission: PendingGameSubmission | null;
  markPendingSubmission: (
    baselineCount: number,
    submissionKind: PendingGameSubmissionKind,
  ) => void;
  clearPendingSubmission: () => void;
};

export const usePendingGameSubmissionStore = create<PendingGameSubmissionStore>(
  (set) => ({
    pendingSubmission: null,
    markPendingSubmission: (baselineCount, submissionKind) =>
      set({
        pendingSubmission: {
          baselineCount,
          submissionKind,
          createdAt: Date.now(),
        },
      }),
    clearPendingSubmission: () => set({ pendingSubmission: null }),
  }),
);
