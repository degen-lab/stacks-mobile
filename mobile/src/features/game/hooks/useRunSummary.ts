import { useCallback, useState } from "react";

import type { PlayerMove } from "../types";
import { buildRunSummary, type RunSummary } from "../utils/runSummary";

type UseRunSummaryOptions = {
  bestSubmittedScore: number | null;
  raffleSubmissionsUsed: number;
};

export const useRunSummary = ({
  bestSubmittedScore,
  raffleSubmissionsUsed,
}: UseRunSummaryOptions) => {
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  const getRunSummary = useCallback(
    (baseScore: number, moves: PlayerMove[] = [], canSubmitScore = true) =>
      buildRunSummary({
        baseScore,
        moves,
        canSubmitScore,
        bestSubmittedScore,
        raffleSubmissionsUsed,
      }),
    [bestSubmittedScore, raffleSubmissionsUsed],
  );

  return { getRunSummary, runSummary, setRunSummary };
};
