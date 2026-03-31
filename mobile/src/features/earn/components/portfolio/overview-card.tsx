import { useState } from "react";

import { Skeleton, Text, Toggle, View } from "@/components/ui";

import formatCurrency from "@/lib/format/currency";
import { maskDisplayValue } from "@/lib/format/mask-display-value";
import type { EarnAssetSnapshot, EarnRewardRow } from "../../types";
import { EarnPortfolioBreakdown } from "./portfolio-breakdown";
import { EarnRewardsList } from "./rewards-list";

const OVERVIEW_CHART_SIZE = 120;

type OverviewMode = "portfolio" | "rewards";

type EarnOverviewCardProps = {
  assets: EarnAssetSnapshot[];
  portfolioTotalUsd: number | null;
  rewardsTotalUsd: number | null;
  rewardRows: EarnRewardRow[];
  isLoading: boolean;
  isRewardsLoading: boolean;
  isBalanceVisible: boolean;
  onPressRewardRow: (row: EarnRewardRow) => void;
  onPressAsset?: (asset: EarnAssetSnapshot) => void;
};

function getOverviewTotalDisplay(
  value: number | null,
  isBalanceVisible: boolean,
) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return { dollars: "—", cents: null };
  }

  const formatted = formatCurrency(value);

  return {
    dollars: isBalanceVisible
      ? formatted.dollars
      : maskDisplayValue(formatted.dollars),
    cents: isBalanceVisible
      ? formatted.cents
      : maskDisplayValue(formatted.cents),
  };
}

function EarnOverviewCardSkeleton() {
  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <View className="gap-1.5">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-8 w-36 rounded" />
        </View>
        <Skeleton className="h-9 w-40 rounded-xl" />
      </View>
      <View className="flex-row items-center gap-4">
        <Skeleton
          className="rounded-full"
          style={{ width: OVERVIEW_CHART_SIZE, height: OVERVIEW_CHART_SIZE }}
        />
        <View className="flex-1 gap-3">
          {[0, 1, 2].map((index) => (
            <View key={index} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-3 w-14 rounded" />
              </View>
              <Skeleton className="h-3 w-14 rounded" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function EarnOverviewCard({
  assets,
  portfolioTotalUsd,
  rewardsTotalUsd,
  rewardRows,
  isLoading,
  isRewardsLoading,
  isBalanceVisible,
  onPressRewardRow,
  onPressAsset,
}: EarnOverviewCardProps) {
  const [mode, setMode] = useState<OverviewMode>("portfolio");
  const totalDisplay = getOverviewTotalDisplay(
    mode === "portfolio" ? portfolioTotalUsd : rewardsTotalUsd,
    isBalanceVisible,
  );

  if (isLoading) {
    return <EarnOverviewCardSkeleton />;
  }

  return (
    <View className="gap-6" testID="earn-overview-card">
      <View className="flex-row items-start justify-between gap-3">
        <View className="gap-1">
          <Text className="font-instrument-sans-semibold text-sm text-secondary">
            {mode === "portfolio" ? "Portfolio" : "Rewards"}
          </Text>
          <View
            testID="earn-overview-total"
            className="flex-row items-baseline gap-1"
          >
            <Text className="text-4xl font-instrument-sans-semibold text-primary">
              {totalDisplay.dollars}
            </Text>
            {totalDisplay.cents ? (
              <Text className="text-2xl font-instrument-sans-semibold text-tertiary">
                {totalDisplay.cents}
              </Text>
            ) : null}
          </View>
        </View>

        <Toggle
          value={mode}
          onChange={setMode}
          variant="card"
          testIDPrefix="earn-overview-toggle"
          options={[
            { value: "portfolio", label: "Portfolio" },
            { value: "rewards", label: "Rewards" },
          ]}
        />
      </View>

      {mode === "portfolio" ? (
        <EarnPortfolioBreakdown
          assets={assets}
          isBalanceVisible={isBalanceVisible}
          onPressAsset={onPressAsset}
        />
      ) : (
        <EarnRewardsList
          rewardRows={rewardRows}
          isLoading={isRewardsLoading}
          isBalanceVisible={isBalanceVisible}
          onPressRewardRow={onPressRewardRow}
        />
      )}
    </View>
  );
}
