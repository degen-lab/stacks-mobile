import { useState } from "react";

import { Skeleton, Text, Toggle, View } from "@/components/ui";

import { maskValue } from "@/lib/format/mask-display-value";
import { formatUsd } from "@/lib/format/currency";
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
          <Text
            testID="earn-overview-total"
            className="font-matter-sq-mono text-4xl text-primary"
          >
            {mode === "portfolio"
              ? maskValue(formatUsd(portfolioTotalUsd), isBalanceVisible)
              : maskValue(formatUsd(rewardsTotalUsd), isBalanceVisible)}
          </Text>
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
