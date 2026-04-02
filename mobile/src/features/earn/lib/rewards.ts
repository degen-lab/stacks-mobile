import type { DualStackingStat } from "@/api/dual-stacking/types";
import type { UserStackingDataRow } from "@/api/stacking";
import { fromSatsToBtc } from "@/lib/format/currency";

import type { EarnRewardRowId, EarnRewardsSummary } from "../types";

type BuildEarnRewardsSummaryArgs = {
  stats: DualStackingStat[] | null | undefined;
  stackingRows: UserStackingDataRow[] | null | undefined;
  currentBtcPriceUsd: number | null;
  currentStxPriceUsd: number | null;
  currentStackingApr: number | null;
  isEnrolledCurrentCycle: boolean;
  isEnrolledNextCycle: boolean;
  lockedStxBalance: number;
  currentTournamentGameSubmissionCount: number;
};

export const EARN_REWARD_ROW_ROUTES: Record<EarnRewardRowId, string> = {
  stacking: "/Earn/stacking",
  "bridge-game": "/stacks-bridge",
  "dual-stacking": "/Earn/dual-stacking",
};

function getCycleDualStackingRewardBtc(stat: DualStackingStat | undefined) {
  if (!stat) return 0;
  return fromSatsToBtc(stat.rewardedSbtc);
}

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
  stats,
  stackingRows,
  currentBtcPriceUsd,
  currentStxPriceUsd,
  currentStackingApr,
  isEnrolledCurrentCycle,
  isEnrolledNextCycle,
  lockedStxBalance,
  currentTournamentGameSubmissionCount,
}: BuildEarnRewardsSummaryArgs): EarnRewardsSummary {
  const normalizedStats = Array.isArray(stats) ? stats : [];
  let cumulativeDualStackingRewardsBtc = 0;

  for (const stat of normalizedStats) {
    cumulativeDualStackingRewardsBtc += getCycleDualStackingRewardBtc(stat);
  }

  const cumulativeStackingRewardsStx = getTotalStackingRewardsStx(stackingRows);
  const stackingActive = lockedStxBalance > 0;
  const dualStackingRewardsUsd =
    currentBtcPriceUsd != null
      ? cumulativeDualStackingRewardsBtc * currentBtcPriceUsd
      : null;
  const stackingRewardsUsd =
    currentStxPriceUsd != null
      ? cumulativeStackingRewardsStx * currentStxPriceUsd
      : null;
  const hasGameSubmissions = currentTournamentGameSubmissionCount > 0;
  const gameSubmissionStatusLabel = hasGameSubmissions
    ? `${currentTournamentGameSubmissionCount} submission${currentTournamentGameSubmissionCount === 1 ? "" : "s"}`
    : "No submissions";
  const totalRewardsUsd =
    dualStackingRewardsUsd == null && stackingRewardsUsd == null
      ? null
      : (dualStackingRewardsUsd ?? 0) + (stackingRewardsUsd ?? 0);

  return {
    totalRewardsUsd,
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
      {
        id: "dual-stacking",
        label: "Dual Stacking",
        statusLabel: isEnrolledCurrentCycle
          ? "Earning"
          : isEnrolledNextCycle
            ? "Enrolled next cycle"
            : "Not active",
        statusTone: isEnrolledCurrentCycle
          ? "active"
          : isEnrolledNextCycle
            ? "pending"
            : "inactive",
        value: cumulativeDualStackingRewardsBtc,
        valueToken: "btc",
      },
    ],
  };
}
