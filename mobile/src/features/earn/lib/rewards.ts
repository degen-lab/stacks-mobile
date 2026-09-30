import type { UserStackingDataRow } from "@/api/stacking";

import type { EarnRewardRowId, EarnRewardsSummary } from "../types";

type BuildEarnRewardsSummaryArgs = {
  stackingRows: UserStackingDataRow[] | null | undefined;
  currentStxPriceUsd: number | null;
  currentStackingApr: number | null;
  lockedStxBalance: number;
  currentTournamentGameSubmissionCount: number;
};

export const EARN_REWARD_ROW_ROUTES: Record<EarnRewardRowId, string> = {
  stacking: "/Earn/stacking",
  "bridge-game": "/stacks-bridge",
};

function getTotalStackingRewardsStx(
  stackingRows: UserStackingDataRow[] | null | undefined,
) {
  const rows = stackingRows ?? [];

  return rows.reduce(
    (total, row) => total + Number(row.rewardedStxAmount ?? 0),
    0,
  );
}

export function buildEarnRewardsSummary({
  stackingRows,
  currentStxPriceUsd,
  currentStackingApr,
  lockedStxBalance,
  currentTournamentGameSubmissionCount,
}: BuildEarnRewardsSummaryArgs): EarnRewardsSummary {
  const cumulativeStackingRewardsStx = getTotalStackingRewardsStx(stackingRows);
  const stackingActive = lockedStxBalance > 0;
  const stackingRewardsUsd =
    currentStxPriceUsd != null
      ? cumulativeStackingRewardsStx * currentStxPriceUsd
      : null;
  const hasGameSubmissions = currentTournamentGameSubmissionCount > 0;
  const gameSubmissionStatusLabel = hasGameSubmissions
    ? `${currentTournamentGameSubmissionCount} submission${currentTournamentGameSubmissionCount === 1 ? "" : "s"}`
    : "No submissions";

  return {
    totalRewardsUsd: stackingRewardsUsd,
    currentStackingApr,
    rows: [
      {
        id: "bridge-game",
        label: "Stacks Bridge",
        statusLabel: gameSubmissionStatusLabel,
        statusTone: hasGameSubmissions ? "active" : "inactive",
        value: 0,
        valueToken: "stx",
      },
      {
        id: "stacking",
        label: "STX Stacking",
        statusLabel: stackingActive ? "Earning" : "Not active",
        statusTone: stackingActive ? "active" : "inactive",
        value: cumulativeStackingRewardsStx,
        valueToken: "stx",
      },
    ],
  };
}
