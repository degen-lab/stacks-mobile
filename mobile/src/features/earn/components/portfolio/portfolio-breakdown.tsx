import { Pie, PolarChart } from "victory-native";

import { Pressable, Text, View } from "@/components/ui";

import { maskValue } from "@/lib/format/mask-display-value";
import { formatUsd } from "@/lib/format/currency";
import type { EarnAssetSnapshot } from "../../types";

const CHART_SIZE = 120;
const EMPTY_CHART_COLOR = "#E6E4E2";
const DEFAULT_TOKEN_COLOR = "#95918C";

type ChartDatum = {
  label: string;
  value: number;
  color: string;
};

type EarnPortfolioBreakdownProps = {
  assets: EarnAssetSnapshot[];
  isBalanceVisible: boolean;
  onPressAsset?: (asset: EarnAssetSnapshot) => void;
};

function getTokenColor(symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (normalizedSymbol === "BTC") return "#F7931A";
  if (normalizedSymbol === "SBTC") return "#FC6432";
  if (normalizedSymbol === "STX") return "#595754";

  return DEFAULT_TOKEN_COLOR;
}

function EarnPortfolioChart({ data }: { data: ChartDatum[] }) {
  const total = data.reduce((sum, datum) => sum + datum.value, 0);
  const chartData =
    total > 0
      ? data.filter((datum) => datum.value > 0)
      : [{ label: "Empty", value: 1, color: EMPTY_CHART_COLOR }];

  return (
    <View style={{ width: CHART_SIZE, height: CHART_SIZE }}>
      <PolarChart
        data={chartData}
        labelKey="label"
        valueKey="value"
        colorKey="color"
      >
        <Pie.Chart innerRadius="58%">
          {() => (
            <>
              <Pie.Slice />
              <Pie.SliceAngularInset
                angularInset={{
                  angularStrokeWidth: 3,
                  angularStrokeColor: "#F7F6F5",
                }}
              />
            </>
          )}
        </Pie.Chart>
      </PolarChart>
    </View>
  );
}

export function EarnPortfolioBreakdown({
  assets,
  isBalanceVisible,
  onPressAsset,
}: EarnPortfolioBreakdownProps) {
  const chartData: ChartDatum[] = assets.map((asset) => ({
    label: asset.symbol,
    value: Math.max(asset.valueUsd ?? 0, 0),
    color: getTokenColor(asset.symbol),
  }));

  return (
    <View className="flex-row items-center gap-4 pb-6 pt-2.5">
      <EarnPortfolioChart data={chartData} />
      <View className="flex-1 gap-3">
        {assets.map((asset) => (
          <Pressable
            key={asset.id}
            className="flex-row items-center justify-between"
            onPress={onPressAsset ? () => onPressAsset(asset) : undefined}
            disabled={!onPressAsset}
            accessibilityRole={onPressAsset ? "button" : undefined}
            accessibilityLabel={
              onPressAsset ? `Open ${asset.name} details` : undefined
            }
          >
            <View className="flex-row items-center gap-2">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: getTokenColor(asset.symbol) }}
              />
              <Text className="font-instrument-sans text-sm text-primary">
                {asset.name}
              </Text>
            </View>
            <Text className="font-instrument-sans-medium text-sm text-secondary">
              {maskValue(
                formatUsd(asset.valueUsd, {
                  compact: true,
                  maximumFractionDigits: 1,
                }),
                isBalanceVisible,
              )}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
