import type {
  DualStackingData,
  DualStackingStat,
} from "@/api/dual-stacking/types";
import { fromSatsToBtc } from "@/lib/format/currency";

import type { EarnRewardRowId, EarnRewardsSummary } from "../types";

type BuildEarnRewardsSummaryArgs = {
  stats: DualStackingStat[] | null | undefined;
  dualStackingData: DualStackingData[] | null | undefined;
  currentBtcPriceUsd: number | null;
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

function getCycleRewardBtc(stat: DualStackingStat | undefined) {
  if (!stat) return 0;
  return (
    fromSatsToBtc(stat.rewardedSbtc) +
    fromSatsToBtc(Number(stat.rewardedStacking ?? 0))
  );
}

function getCycleSbtcRewardBtc(stat: DualStackingStat | undefined) {
  if (!stat) return 0;
  return fromSatsToBtc(stat.rewardedSbtc);
}

function getCycleStxRewardBtc(stat: DualStackingStat | undefined) {
  if (!stat) return 0;
  return fromSatsToBtc(Number(stat.rewardedStacking ?? 0));
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
  dualStackingData,
  currentBtcPriceUsd,
  currentStackingApr,
  isEnrolledCurrentCycle,
  isEnrolledNextCycle,
  lockedStxBalance,
  hasActiveGameSubmission,
}: BuildEarnRewardsSummaryArgs): EarnRewardsSummary {
  const normalizedStats = Array.isArray(stats) ? stats : [];

  let cumulativeRewardsBtc = 0;
  let cumulativeSbtcRewardsBtc = 0;
  let cumulativeStxRewardsBtc = 0;

  for (const stat of normalizedStats) {
    cumulativeRewardsBtc += getCycleRewardBtc(stat);
    cumulativeSbtcRewardsBtc += getCycleSbtcRewardBtc(stat);
    cumulativeStxRewardsBtc += getCycleStxRewardBtc(stat);
  }

  const stackingActive = lockedStxBalance > 0;

  return {
    totalRewardsUsd:
      currentBtcPriceUsd != null
        ? cumulativeRewardsBtc * currentBtcPriceUsd
        : null,
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
        value: cumulativeStxRewardsBtc,
        valueToken: "btc",
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
        value: cumulativeSbtcRewardsBtc,
        valueToken: "btc",
      },
    ],
  };
}
