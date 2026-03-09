import { useMemo } from "react";
import { useAprConstants } from "./useAprConstants";
import {
  useAmountStackedNow,
  useSbtcInWallet,
  useUserTotalSbtcInDefi,
} from "@/api/dual-stacking/contract/hooks";
import { useEnrollmentStatus } from "./useEnrollmentStatus";
import { useDualStackingDataWithLatestCycle } from "./useDualStackingData";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import { useDualStackingStats, useProjectRewards } from "@/api/dual-stacking";
import { fromSatsToBtc, fromUstxToStx } from "@/lib/format/currency";
import { avg, rewardsCompositionPercentages } from "../utils/apr-calculations";
import { useCoinPricesForYield } from "./useCoinPricesForYield";

export function useAprComputation() {
  const { stxAddress } = useWalletAddresses();
  const principal = principalArgFromAddress(stxAddress);
  const { enrolledCurrentCycle, enrolledNextCycle } = useEnrollmentStatus();
  const { baseAPR, maxAPR } = useAprConstants();

  const {
    data: stxStacked,
    isLoading: stxLoading,
    isError: stxError,
  } = useAmountStackedNow(principal);
  const {
    data: totalSbtcDefi,
    isLoading: defiLoading,
    isError: defiError,
  } = useUserTotalSbtcInDefi(principal);
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
  const hasProjectionBalances =
    stxStacked !== undefined &&
    totalSbtcDefi !== undefined &&
    sbtcBalance !== undefined;

  const latestStat = useMemo(() => {
    if (!Array.isArray(userStats)) return undefined;
    return userStats.find((s) => s.cycleId === latestCycleId);
  }, [userStats, latestCycleId]);

  const projectedRewardsParams = useMemo(
    () => ({
      address: stxAddress as string,
      maxApr: maxAPR,
      ...(userBalancesForProjection &&
        hasProjectionBalances && {
          sbtcWallet: Number(sbtcBalance || 0),
          sbtcDefi: Number(totalSbtcDefi || 0),
          stx: Number(stxStacked || 0),
        }),
    }),
    [
      stxAddress,
      userBalancesForProjection,
      totalSbtcDefi,
      sbtcBalance,
      stxStacked,
      maxAPR,
      hasProjectionBalances,
    ],
  );

  const shouldQueryRewards =
    !!stxAddress &&
    enrolledNextCycle &&
    (!userBalancesForProjection || hasProjectionBalances);
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
    totalSbtcDefi: Number(totalSbtcDefi),
    sbtcBalance: Number(sbtcBalance),
    stxStacked: Number(stxStacked),
    isLoading: stxLoading || defiLoading || sbtcLoading,
    isError: stxError || defiError || sbtcError,
  };
}
