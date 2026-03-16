import { fromSatsToBtc, fromUstxToStx } from "@/lib/format/currency";
import { useAprComputation } from "@/features/dual-stacking/hooks/use-apr-computation";
import { YieldCompositionCard } from "./CompositionCard";
import { YieldCompositionCardSkeleton } from "./CompositionCard.skeleton";
import type { YieldSource } from "./types";

export function CompositionCardContainer() {
  const {
    baseApr,
    boostedApr,
    rewardsComposition,
    stxAvg,
    sbtcTotalAvg,
    stackingAprCoinPrices,
    isLoading,
    isError,
  } = useAprComputation();

  if (isLoading) {
    return <YieldCompositionCardSkeleton />;
  }

  if (isError) {
    return null;
  }

  const onlyBaseColor = Number(rewardsComposition.base) === 100;
  const baseColor = onlyBaseColor ? "#FFC2A8" : "#FC6432";
  const indicatorColor = onlyBaseColor ? "#FF8761" : "#FF6432";

  const sources: YieldSource[] = [
    {
      id: "sbtc-yield",
      name: "sBTC Base",
      percentage: Number(rewardsComposition.base),
      valueForApyCalculation: fromSatsToBtc(Number(sbtcTotalAvg)),
      apy: Number(baseApr.toFixed(2)),
      currency: "sBTC",
      color: baseColor,
      chartColor: baseColor,
      indicatorColor,
    },
  ];

  if (Number(rewardsComposition.boosted) > 0) {
    sources.push({
      id: "sbtc-boosted",
      name: "sBTC Boosted",
      valueForApyCalculation: fromSatsToBtc(Number(sbtcTotalAvg)),
      percentage: Number(rewardsComposition.boosted),
      currency: "sBTC",
      apy: Number(boostedApr.toFixed(2)),
      color: "#FFAD65",
      chartColor: "#FFAD65",
      indicatorColor: "#FFAD65",
    });
  }

  if (Number(rewardsComposition.stacking) > 0) {
    sources.push({
      id: "stx-stacked",
      name: "STX Stacking",
      valueForApyCalculation: fromUstxToStx(Number(stxAvg)),
      currency: "STX",
      percentage: Number(rewardsComposition.stacking),
      apy: Number(stackingAprCoinPrices?.toFixed(2) ?? 0),
      color: "#595754",
      chartColor: "#595754",
      indicatorColor: "#595754",
    });
  }

  return <YieldCompositionCard sources={sources} />;
}
