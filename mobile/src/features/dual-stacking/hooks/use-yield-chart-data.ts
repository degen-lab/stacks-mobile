import { useMemo } from "react";

import {
  useCurrentBitcoinBlockHeight,
  useSbtcInWallet,
  useUserStackingDefiBalances,
} from "@/api/dual-stacking/contract/hooks";
import { useDualStackingData } from "@/api/dual-stacking/use-dual-stacking-data";
import { useDualStackingStats } from "@/api/dual-stacking/use-dual-stacking-stats";
import { useProjectRewards } from "@/api/dual-stacking";
import type {
  DualStackingData,
  DualStackingStat,
} from "@/api/dual-stacking/types";
import { fromSatsToBtc } from "@/lib/format/currency";
import { calculateBlockEndTime, MS_PER_DAY } from "@/lib/format/date";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { avg } from "../utils/apr-calculations";
import { useAprConstants } from "./use-apr-constants";
import { useDualStackingDataWithLatestCycle } from "./use-dual-stacking-data";
import { useEnrollmentStatus } from "./use-enrollment-status";
import type { TimePeriod } from "../components/rewards/portfolio/chart/types";
import type { Unit } from "../components/rewards/portfolio/chart/UnitToggle";

export interface YieldChartPoint {
  cycle: number;
  isCurrentCycle: boolean;
  date: string;
  display: string;
  timestamp: number;
  totalRewarded: number;
  isStacking: boolean;
  baseApr: number;
  boostedApr: number;
  stxApr: number;
  totalApr: number;
  baseSbtc: number;
  boostedSbtc: number;
  rewardedStacking: number;
  cumulativeBase: number;
  cumulativeBoosted: number;
  cumulativeStacking: number;
}

function formatChartDate(tsSeconds: number | null | undefined) {
  if (!tsSeconds || typeof tsSeconds !== "number") {
    return { iso: "", display: "" };
  }
  const d = new Date(tsSeconds * 1000);
  const iso = d.toISOString().slice(0, 10);
  const display = `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}`;
  return { iso, display };
}

export function useYieldChartData(
  unit: Unit = "percent",
  period: TimePeriod = 90,
): YieldChartPoint[] {
  const { stxAddress } = useWalletAddresses();
  const principal = principalArgFromAddress(stxAddress);
  const { baseAPR, projectRewardsMaxApr } = useAprConstants();

  const { data: dualStackingStats, isLoading: loadingUserStats } =
    useDualStackingStats({
      variables: { address: stxAddress ?? "" },
      enabled: !!stxAddress,
    });

  const { data: yieldCyclesMeta, isLoading: loadingYieldCyclesMeta } =
    useDualStackingData();

  const {
    data: currentBitcoinBlockHeight,
    isLoading: loadingCurrentBitcoinHeight,
  } = useCurrentBitcoinBlockHeight();

  const { enrolledNextCycle } = useEnrollmentStatus();

  const {
    data: stackingDefiBalances,
    isLoading: loadingStackingDefiBalances,
    isError: defiReadError,
  } = useUserStackingDefiBalances(principal);
  const currentStxStackedUstx = stackingDefiBalances?.stxStackedUstx;
  const totalSbtcInDefi = stackingDefiBalances?.totalDefiSats;
  const { data: sbtcWalletBalanceSats, isLoading: loadingSbtcWalletBalance } =
    useSbtcInWallet(principal);

  const { cycle: latestCycleId } = useDualStackingDataWithLatestCycle();

  const includeLiveBalances =
    enrolledNextCycle &&
    sbtcWalletBalanceSats !== undefined &&
    currentStxStackedUstx !== undefined &&
    (totalSbtcInDefi !== undefined || defiReadError);

  const projectionRequestParams = useMemo(
    () => ({
      address: stxAddress as string,
      maxApr: projectRewardsMaxApr,
      ...(includeLiveBalances && {
        sbtcWallet: Number(sbtcWalletBalanceSats || 0),
        sbtcDefi: Number(totalSbtcInDefi || 0),
        stx: Number(currentStxStackedUstx || 0),
      }),
    }),
    [
      stxAddress,
      totalSbtcInDefi,
      sbtcWalletBalanceSats,
      currentStxStackedUstx,
      projectRewardsMaxApr,
      includeLiveBalances,
    ],
  );

  const shouldQueryProjectedRewards =
    !!stxAddress && (!enrolledNextCycle || includeLiveBalances);
  const { data: projectedRewards, isLoading: loadingProjectedRewards } =
    useProjectRewards({
      variables: projectionRequestParams,
      enabled: shouldQueryProjectedRewards,
    });

  const projectedExpectedApr = Number(projectedRewards?.expectedTotalApr || 0);
  const projectedStackingApr = Number(
    projectedRewards?.expectedStackingApr || 0,
  );
  const projectedBoostedApr =
    Number(projectedRewards?.expectedAPR || 0) -
    Number(projectedRewards?.baseAPR || 0);

  const isLoading =
    loadingUserStats ||
    loadingYieldCyclesMeta ||
    loadingCurrentBitcoinHeight ||
    loadingStackingDefiBalances ||
    loadingSbtcWalletBalance ||
    loadingProjectedRewards ||
    !yieldCyclesMeta;

  return useMemo(() => {
    if (!Array.isArray(dualStackingStats) || !Array.isArray(yieldCyclesMeta)) {
      return [];
    }
    if (isLoading) {
      return [];
    }

    const cycleMetaById = new Map<number, DualStackingData>(
      (yieldCyclesMeta as DualStackingData[]).map((c) => [c.cycle_id, c]),
    );

    let points: YieldChartPoint[] = (
      dualStackingStats as DualStackingStat[]
    ).map((stat): YieldChartPoint => {
      const cycleId = stat.cycleId;
      const meta = cycleMetaById.get(cycleId);

      const isCurrentCycle = latestCycleId === cycleId;

      const sbtcWalletSnapshots = Array.isArray(stat.sbtcWalletSnapshots)
        ? stat.sbtcWalletSnapshots
        : [];
      const stxSnapshots = Array.isArray(stat.stxSnapshots)
        ? stat.stxSnapshots
        : [];
      const avgSbtcInWallet = avg(sbtcWalletSnapshots);
      const avgStxStackedUstx = avg(stxSnapshots);
      const isStacking = avgStxStackedUstx > 0;

      const baseAprForCycle = isCurrentCycle
        ? enrolledNextCycle && avgSbtcInWallet > 0
          ? Number(projectedRewards?.baseAPR || baseAPR)
          : 0
        : Number(stat.baseApr ?? 0);

      const boostedAprForCycle = isCurrentCycle
        ? Number(projectedBoostedApr)
        : Number(stat.boostedApr ?? 0) - Number(baseAprForCycle ?? 0);

      const stackingAprForCycle = isCurrentCycle
        ? avgStxStackedUstx > 0
          ? Number(projectedStackingApr)
          : 0
        : Number(stat.stackingApr ?? 0);

      const totalApr =
        (isCurrentCycle ? projectedExpectedApr : Number(stat.totalApr ?? 0)) ||
        0;

      const totalRewardedSbtc =
        isCurrentCycle && projectedRewards?.expectedUserRewards
          ? fromSatsToBtc(Number(projectedRewards.expectedUserRewards))
          : fromSatsToBtc(stat.rewardedSbtc);

      const rewardedStacking = isCurrentCycle
        ? fromSatsToBtc(Number(projectedRewards?.expectedRewardsStacking ?? 0))
        : fromSatsToBtc(Number(stat.rewardedStacking ?? 0));

      const baseSbtc =
        (Number(totalRewardedSbtc) /
          (boostedAprForCycle + baseAprForCycle || 1)) *
        baseAprForCycle;
      const boostedSbtc = Number(totalRewardedSbtc) - baseSbtc;

      const { iso, display: rawDisplay } = formatChartDate(meta?.end_time);
      const display =
        rawDisplay && rawDisplay !== "undefined"
          ? rawDisplay
          : typeof cycleId === "number"
            ? `Cycle ${cycleId}`
            : "—";
      const timestamp = ((meta?.end_time ?? 0) as number) * 1000;

      const cumulativeBaseVal = unit === "sbtc" ? baseSbtc : baseAprForCycle;
      const cumulativeBoostedVal =
        unit === "sbtc" ? baseSbtc + boostedSbtc : boostedAprForCycle;
      const cumulativeStackingVal =
        unit === "sbtc"
          ? baseSbtc + boostedSbtc + rewardedStacking
          : Number(stackingAprForCycle);

      return {
        cycle: cycleId,
        date: iso,
        display,
        timestamp,
        isCurrentCycle,
        totalRewarded: totalRewardedSbtc + rewardedStacking,
        baseApr: baseAprForCycle,
        boostedApr: boostedAprForCycle,
        totalApr,
        stxApr: stackingAprForCycle,
        baseSbtc,
        boostedSbtc,
        rewardedStacking,
        isStacking,
        cumulativeBase: cumulativeBaseVal,
        cumulativeBoosted: cumulativeBoostedVal,
        cumulativeStacking: isStacking
          ? cumulativeStackingVal
          : cumulativeBoostedVal,
      };
    });

    // Compute estimated end time for the latest cycle whenever end_time is null/0
    // (regardless of enrollment — the current cycle always has no end_time yet)
    if (currentBitcoinBlockHeight && latestCycleId != null) {
      const currentCycleMeta = (yieldCyclesMeta as DualStackingData[]).find(
        (c) => c.cycle_id === latestCycleId,
      );
      if (currentCycleMeta && !currentCycleMeta.end_time) {
        const estimatedEndTimeMs = calculateBlockEndTime(
          Number(currentBitcoinBlockHeight),
          currentCycleMeta.next_cycle_bitcoin_height,
        );
        const estimatedEndTimeSec = Math.floor(estimatedEndTimeMs / 1000);
        const latestPoint = points.find((p) => p.cycle === latestCycleId);
        const { iso, display: rawEstDisplay } =
          formatChartDate(estimatedEndTimeSec);
        const estDisplay =
          rawEstDisplay && rawEstDisplay !== "undefined"
            ? rawEstDisplay
            : typeof latestCycleId === "number"
              ? `Cycle ${latestCycleId}`
              : "—";

        if (latestPoint) {
          latestPoint.date = iso;
          latestPoint.display = `${estDisplay} (Est.)`;
          latestPoint.timestamp = estimatedEndTimeMs;
        } else {
          points.push({
            cycle: latestCycleId,
            date: iso,
            display: `${estDisplay} (Est.)`,
            timestamp: estimatedEndTimeMs,
            isCurrentCycle: true,
            totalRewarded: 0,
            isStacking: false,
            baseApr: 0,
            boostedApr: 0,
            totalApr: 0,
            stxApr: 0,
            baseSbtc: 0,
            boostedSbtc: 0,
            rewardedStacking: 0,
            cumulativeBase: 0,
            cumulativeBoosted: 0,
            cumulativeStacking: 0,
          });
        }
      }
    }

    points.sort((a, b) => b.cycle - a.cycle);

    if (period !== 90) {
      const now = Date.now();
      const cutoff = now - period * MS_PER_DAY;
      points = points.filter((p) => p.timestamp >= cutoff);
    }

    points.reverse();
    return points;
  }, [
    dualStackingStats,
    yieldCyclesMeta,
    currentBitcoinBlockHeight,
    projectedRewards,
    baseAPR,
    enrolledNextCycle,
    latestCycleId,
    period,
    unit,
    projectedExpectedApr,
    projectedStackingApr,
    projectedBoostedApr,
    isLoading,
  ]);
}
