import type {
  DualStackingData,
  DualStackingStat,
} from "@/api/dual-stacking/types";
import type { UserStackingDataRow } from "@/api/stacking";
import { fromSatsToBtc } from "@/lib/format/currency";

import type { EarnRewardRowId, EarnRewardsSummary } from "../types";

type BuildEarnRewardsSummaryArgs = {
  stats: DualStackingStat[] | null | undefined;
  stackingRows: UserStackingDataRow[] | null | undefined;
  dualStackingData: DualStackingData[] | null | undefined;
  currentBtcPriceUsd: number | null;
  currentStxPriceUsd: number | null;
  currentStackingApr: number | null;
  isEnrolledCurrentCycle: boolean;
  isEnrolledNextCycle: boolean;
  lockedStxBalance: number;
  hasActiveGameSubmission: boolean;
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

function getNextRewardDateLabel(
  dualStackingData: DualStackingData[] | null | undefined,
) {
  const cycles = dualStackingData ?? [];
  const nextCycle = cycles
    .filter(
      (c) => Number.isFinite(c.end_time) && c.end_time * 1000 >= Date.now(),
    )
    .sort((a, b) => a.end_time - b.end_time)[0];
  const fallbackCycle = cycles
    .slice()
    .sort((a, b) => b.end_time - a.end_time)[0];
  const source = nextCycle ?? fallbackCycle;

  if (!source?.end_time) return null;

  return new Date(source.end_time * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function buildEarnRewardsSummary({
  stats,
  stackingRows,
  dualStackingData,
  currentBtcPriceUsd,
  currentStxPriceUsd,
  currentStackingApr,
  isEnrolledCurrentCycle,
  isEnrolledNextCycle,
  lockedStxBalance,
  hasActiveGameSubmission,
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
  const totalRewardsUsd =
    dualStackingRewardsUsd == null && stackingRewardsUsd == null
      ? null
      : (dualStackingRewardsUsd ?? 0) + (stackingRewardsUsd ?? 0);

  return {
    totalRewardsUsd,
    currentStackingApr,
    nextRewardDateLabel: getNextRewardDateLabel(dualStackingData),
    rows: [
      {
        id: "bridge-game",
        label: "Stacks Bridge",
        statusLabel: hasActiveGameSubmission ? "Earning" : "No submissions",
        statusTone: hasActiveGameSubmission ? "active" : "inactive",
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
            ? "Next cycle"
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
