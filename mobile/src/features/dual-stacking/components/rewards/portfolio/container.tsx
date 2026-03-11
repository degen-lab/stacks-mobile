import { useMemo, useState } from "react";

import {
  useAmountStackedNow,
  useIsContractActive,
  useSbtcInWallet,
  useUserTotalSbtcInDefi,
} from "@/api/dual-stacking/contract/hooks";
import { useDualStackingStats } from "@/api/dual-stacking/use-dual-stacking-stats";
import { fromSatsToBtc, fromUstxToStx } from "@/lib/format/currency";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useAprComputation } from "@/features/dual-stacking/hooks/use-apr-computation";
import { useCoinPricesForYield } from "@/features/dual-stacking/hooks/use-coin-prices-for-yield";
import { useEnrollmentStatus } from "@/features/dual-stacking/hooks/use-enrollment-status";
import { useYieldChartData } from "@/features/dual-stacking/hooks/use-yield-chart-data";
import { divisorNetwork } from "@/lib/stacks/utils";

import type {
  ChartLegendItem,
  PortfolioPerformanceData,
  TimePeriod,
} from "./chart/types";
import type { Unit } from "./chart/UnitToggle";
import { PortfolioPerformanceCard } from "./PortfolioPerformanceCard";
import { PortfolioPerformanceCardSkeleton } from "./PortfolioPerformanceCard.skeleton";

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function PortfolioPerformanceCardContainer() {
  const { stxAddress } = useWalletAddresses();
  const principal = principalArgFromAddress(stxAddress);

  const { data: sbtcBalanceSats, isLoading: loadingSbtc } =
    useSbtcInWallet(principal);
  const { data: totalSbtcInDefiSats, isLoading: loadingDefi } =
    useUserTotalSbtcInDefi(principal);
  const { data: stxStackedUstx, isLoading: loadingStacked } =
    useAmountStackedNow(principal);
  const { data: userStats, isLoading: loadingUserStats } = useDualStackingStats(
    {
      variables: { address: stxAddress ?? "" },
      enabled: !!stxAddress,
    },
  );
  const { data: isContractActive } = useIsContractActive();
  const { enrolledNextCycle } = useEnrollmentStatus();
  const { data: coinPrices, isLoading: loadingPrices } =
    useCoinPricesForYield();

  const btcUsd = Number(coinPrices?.btc_price ?? 0);
  const stxUsd = Number(coinPrices?.stx_price ?? 0);

  const stxStacked = fromUstxToStx((stxStackedUstx as number) ?? 0);
  const sbtcBalance = fromSatsToBtc((sbtcBalanceSats as number) ?? 0);
  const totalSbtcInDefi =
    fromSatsToBtc((totalSbtcInDefiSats as number) ?? 0) / divisorNetwork;

  const totalSbtc = sbtcBalance + totalSbtcInDefi;
  const totalSbtcUsd = totalSbtc * btcUsd;
  const stxStackedUsd = stxStacked * stxUsd;
  const stxStackedAsBtc = btcUsd > 0 ? stxStackedUsd / btcUsd : 0;
  const portfolioValueUsd = totalSbtcUsd + stxStackedUsd;
  const portfolioValueBtc = totalSbtc + stxStackedAsBtc;

  const { baseApr, stackingApr, boostedApr } = useAprComputation();

  const legendItems: ChartLegendItem[] = useMemo(() => {
    const items: ChartLegendItem[] = [];

    if (totalSbtc > 0) {
      items.push({
        id: "sbtc-yield",
        label: "Base sBTC Rewards",
        apy: Number(baseApr?.toFixed(2) || 0),
        color: "#FC6432",
        lineStyle: "dashed",
      });
    }

    if (stxStacked > 0 && boostedApr > 0) {
      items.push({
        id: "stacking-boost",
        label: "sBTC Boosted Rewards",
        apy: Number(boostedApr?.toFixed(2) || 0),
        color: "#FFAD65",
      });
    }

    if (Number(stackingApr) > 0 && stxStacked > 0) {
      items.push({
        id: "stx-stacking",
        label: "STX Stacking Rewards",
        apy: Number(stackingApr?.toFixed(2) || 0),
        color: "#595754",
      });
    }

    return items;
  }, [totalSbtc, stxStacked, baseApr, boostedApr, stackingApr]);

  const isEmptyUserStats = Array.isArray(userStats) && userStats.length === 0;
  const isEmptyChart = isEmptyUserStats && enrolledNextCycle;

  const [unit, setUnit] = useState<Unit>("percent");
  const [period, setPeriod] = useState<TimePeriod>(90);

  const chartData = useYieldChartData(unit, period);

  const averageTotalApr = useMemo(() => {
    if (chartData.length === 0) return 0;
    const totalRewarded = chartData.reduce(
      (sum, point) => sum + (point.totalRewarded ?? 0),
      0,
    );
    if (totalRewarded === 0) return 0;
    const weightedSum = chartData.reduce(
      (sum, point) => sum + point.totalApr * (point.totalRewarded ?? 0),
      0,
    );
    return weightedSum / totalRewarded;
  }, [chartData]);

  const totalRewardedSbtc = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData.reduce(
      (acc, point) => (point.isCurrentCycle ? acc : acc + point.totalRewarded),
      0,
    );
  }, [chartData]);

  const totalRewardedUsd = totalRewardedSbtc * btcUsd;

  const data: PortfolioPerformanceData = useMemo(
    () => ({
      metrics: {
        percentage: averageTotalApr,
        period,
        description: "90-day average APY",
      },
      legendItems,
      earnings: {
        amount: round(totalRewardedSbtc, 8),
        usdValue: round(totalRewardedUsd, 2),
        description: "Total sBTC earned since Dual Stacking started",
      },
      portfolioValue: {
        usd: round(portfolioValueUsd, 2),
        btc: round(portfolioValueBtc, 8),
      },
    }),
    [
      legendItems,
      portfolioValueUsd,
      portfolioValueBtc,
      totalRewardedSbtc,
      totalRewardedUsd,
      averageTotalApr,
      period,
    ],
  );

  const isLoading =
    loadingSbtc ||
    loadingDefi ||
    loadingStacked ||
    loadingPrices ||
    loadingUserStats ||
    sbtcBalanceSats === undefined ||
    totalSbtcInDefiSats === undefined ||
    stxStackedUstx === undefined ||
    !coinPrices?.btc_price;

  if (isLoading) return <PortfolioPerformanceCardSkeleton />;

  return (
    <PortfolioPerformanceCard
      chartData={chartData}
      data={data}
      isEmptyChart={Boolean(isEmptyChart)}
      isContractActive={Boolean(isContractActive)}
      onUnitChange={setUnit}
      onPeriodChange={setPeriod}
      unit={unit}
      period={period}
      timeUntilCycleStartLabel=""
      timeUntilContractActiveLabel=""
    />
  );
}
