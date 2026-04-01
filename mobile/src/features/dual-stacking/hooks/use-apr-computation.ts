import { useMemo } from "react";
import { useAprConstants } from "./use-apr-constants";
import {
  useSbtcInWallet,
  useUserStackingDefiBalances,
} from "@/api/dual-stacking/contract/hooks";
import { useEnrollmentStatus } from "./use-enrollment-status";
import { useDualStackingDataWithLatestCycle } from "./use-dual-stacking-data";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import { useDualStackingStats, useProjectRewards } from "@/api/dual-stacking";
import { fromSatsToBtc, fromUstxToStx } from "@/lib/format/currency";
import { avg, rewardsCompositionPercentages } from "../utils/apr-calculations";
import { useCoinPricesForYield } from "./use-coin-prices-for-yield";

export function useAprComputation() {
  const { stxAddress } = useWalletAddresses();
  const principal = principalArgFromAddress(stxAddress);
  const { enrolledCurrentCycle, enrolledNextCycle } = useEnrollmentStatus();
  const { baseAPR, maxAPR, projectRewardsMaxApr } = useAprConstants();

  const {
    data: stackingDefiBalances,
    isLoading: stackingDefiLoading,
    isError: stackingDefiError,
  } = useUserStackingDefiBalances(principal);
  const stxStacked = stackingDefiBalances?.stxStackedUstx;
  const totalSbtcDefi = stackingDefiBalances?.totalDefiSats;
  const {
    data: sbtcBalance,
    isLoading: sbtcLoading,
    isError: sbtcError,
  } = useSbtcInWallet(principal);

  const { data: userStats } = useDualStackingStats({
    variables: {
      address: stxAddress as string,
    },
    enabled: !!stxAddress,
  });

  const { data: coinPrices } = useCoinPricesForYield();
  const { cycle: latestCycleId } = useDualStackingDataWithLatestCycle();

  const userBalancesForProjection = enrolledNextCycle && !enrolledCurrentCycle;
  const includeLiveBalances =
    enrolledNextCycle &&
    sbtcBalance !== undefined &&
    stxStacked !== undefined &&
    (totalSbtcDefi !== undefined || stackingDefiError);

  const latestStat = useMemo(() => {
    if (!Array.isArray(userStats)) return undefined;
    return userStats.find((s) => s.cycleId === latestCycleId);
  }, [userStats, latestCycleId]);

  const projectedRewardsParams = useMemo(
    () => ({
      address: stxAddress as string,
      maxApr: projectRewardsMaxApr,
      ...(includeLiveBalances && {
        sbtcWallet: Number(sbtcBalance || 0),
        sbtcDefi: Number(totalSbtcDefi || 0),
        stx: Number(stxStacked || 0),
      }),
    }),
    [
      stxAddress,
      totalSbtcDefi,
      sbtcBalance,
      stxStacked,
      projectRewardsMaxApr,
      includeLiveBalances,
    ],
  );

  const shouldQueryRewards =
    !!stxAddress && (!enrolledNextCycle || includeLiveBalances);
  const { data: projectedReward } = useProjectRewards({
    variables: projectedRewardsParams,
    enabled: shouldQueryRewards,
  });

  const sbtcWalletAvg = useMemo(() => {
    if (userBalancesForProjection) return Number(sbtcBalance || 0);
    return latestStat?.sbtcWalletSnapshots?.length
      ? avg(latestStat?.sbtcWalletSnapshots)
      : 0;
  }, [userBalancesForProjection, sbtcBalance, latestStat]);

  const sbtcDeFiAvg = useMemo(() => {
    if (userBalancesForProjection) return Number(totalSbtcDefi || 0);
    return latestStat?.sbtcDefiSnapshots?.length
      ? avg(latestStat?.sbtcDefiSnapshots)
      : 0;
  }, [userBalancesForProjection, totalSbtcDefi, latestStat]);

  const stxAvg = useMemo(() => {
    if (userBalancesForProjection) return Number(stxStacked || 0);
    return latestStat?.stxSnapshots?.length ? avg(latestStat?.stxSnapshots) : 0;
  }, [userBalancesForProjection, stxStacked, latestStat]);

  const baseApr = userBalancesForProjection
    ? Number(projectedReward?.baseAPR || baseAPR)
    : latestStat?.baseApr
      ? Number(latestStat?.baseApr)
      : baseAPR;

  const expectedBaseApr = Number(projectedReward?.baseAPR || 0);
  const expectedApr = Number(projectedReward?.expectedAPR || 0);
  const expectedStackingApr = Number(projectedReward?.expectedStackingApr || 0);
  const expectedTotalApr = Number(projectedReward?.expectedTotalApr || 0) || 0;

  const historicalBoostedApr = Math.max(
    0,
    Number(latestStat?.boostedApr || 0) - baseApr,
  );
  const historicalStackingApr = Number(latestStat?.stackingApr || 0);
  const historicalTotalApr = Number(latestStat?.totalApr || 0);

  const boostedApr = historicalBoostedApr
    ? historicalBoostedApr
    : expectedApr - expectedBaseApr;

  const stackingApr = historicalStackingApr
    ? historicalStackingApr
    : expectedStackingApr;
  const stackingAprCoinPrices = Number(coinPrices?.stacking_apr || 0);
  const totalApr = userBalancesForProjection
    ? expectedTotalApr
    : historicalTotalApr;

  const rewardsComposition = rewardsCompositionPercentages(
    fromSatsToBtc(sbtcWalletAvg),
    fromSatsToBtc(sbtcDeFiAvg),
    fromUstxToStx(stxAvg),
    baseApr,
    maxAPR,
    expectedApr,
    stackingAprCoinPrices,
    Number(coinPrices?.btc_price),
    Number(coinPrices?.stx_price),
  );

  return {
    baseApr,
    boostedApr,
    stackingApr,
    totalApr,
    rewardsComposition,
    expectedApr,
    expectedTotalApr,
    expectedStackingApr,

    sbtcWalletAvg,
    sbtcDeFiAvg,
    sbtcTotalAvg: sbtcWalletAvg + sbtcDeFiAvg,
    stxAvg,
    stackingAprCoinPrices,
    totalSbtcDefi: Number(totalSbtcDefi ?? 0),
    sbtcBalance: Number(sbtcBalance ?? 0),
    stxStacked: Number(stxStacked ?? 0),
    isLoading: stackingDefiLoading || sbtcLoading,
    isError: stackingDefiError || sbtcError,
  };
}
