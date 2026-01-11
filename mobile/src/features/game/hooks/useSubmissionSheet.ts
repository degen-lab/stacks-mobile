import { useCallback, useMemo, useRef, useState } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

export type SubmissionKind = "tournament" | "raffle";
export type SubmissionContext = { kind: SubmissionKind } | null;

export const useSubmissionSheet = () => {
  const [submissionContext, setSubmissionContext] =
    useState<SubmissionContext>(null);
  const [submissionOpenCount, setSubmissionOpenCount] = useState(0);
  const submissionSheetRef = useRef<BottomSheetModal>(null);

  const openSubmissionSheet = useCallback((kind: SubmissionKind) => {
    setSubmissionContext({ kind });
    setSubmissionOpenCount((count) => count + 1);
    submissionSheetRef.current?.present();
  }, []);

  const handleSubmitLeaderboard = useCallback(() => {
    openSubmissionSheet("tournament");
  }, [openSubmissionSheet]);

  const handleSubmitRaffle = useCallback(() => {
    openSubmissionSheet("raffle");
  }, [openSubmissionSheet]);

  const handleSubmissionCancel = useCallback(() => {
    setSubmissionContext(null);
    submissionSheetRef.current?.dismiss();
  }, []);

  const derived = useMemo(() => {
    const isRaffle = submissionContext?.kind === "raffle";
    return {
      tournamentId: isRaffle ? "weekly-raffle" : "weekly-tournament",
      tournamentName: isRaffle ? "Weekly Raffle" : "Weekly Tournament",
      rewardAmount: isRaffle ? "1000 STX" : "500 STX",
      showRankChange: !isRaffle,
    };
  }, [submissionContext?.kind]);

  return {
    submissionContext,
    submissionOpenCount,
    submissionSheetRef,
    handleSubmissionCancel,
    handleSubmitLeaderboard,
    handleSubmitRaffle,
    ...derived,
  };
};
