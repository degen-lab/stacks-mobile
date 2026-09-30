import { View } from "react-native";
import { PerformanceHeader } from "./PerformanceHeader";
import { PortfolioValueDisplay } from "./PortfolioValueDisplay";
import { EarningsDisplay } from "./EarningsDisplay";
import { ChartSectionLayout } from "./chart/ChartSectionLayout";
import type { PortfolioPerformanceData, TimePeriod } from "./chart/types";
import type { Unit } from "./chart/UnitToggle";
import type { YieldChartPoint } from "@/features/dual-stacking/hooks/use-yield-chart-data";

export type PortfolioPerformanceCardProps = {
  chartData: YieldChartPoint[];
  data: PortfolioPerformanceData;
  isEmptyChart: boolean;
  isAwaitingRewardsData?: boolean;
  isContractActive?: boolean;
  onUnitChange: (unit: Unit) => void;
  onPeriodChange: (period: TimePeriod) => void;
  timeUntilCycleStartLabel: string;
  timeUntilContractActiveLabel: string;
  unit: Unit;
  period: TimePeriod;
};

export function PortfolioPerformanceCard({
  chartData,
  data,
  isEmptyChart,
  isAwaitingRewardsData,
  isContractActive,
  timeUntilCycleStartLabel,
  timeUntilContractActiveLabel,
  onUnitChange,
  onPeriodChange,
  unit,
  period,
}: PortfolioPerformanceCardProps) {
  const showData = isContractActive && !isEmptyChart;

  return (
    <View className="border-border-secondary rounded-xl border bg-transparent">
      {/* Header */}
      <View className="px-5 pt-5 pb-4">
        <View className="items-start gap-4">
          {showData && <PerformanceHeader metrics={data.metrics} />}
          <PortfolioValueDisplay value={data.portfolioValue} />
        </View>
      </View>

      {/* Content */}
      <View className="px-5 pb-5">
        <ChartSectionLayout
          chartData={chartData}
          legendItems={data.legendItems}
          timeUntilCycleStartLabel={timeUntilCycleStartLabel}
          timeUntilContractActiveLabel={timeUntilContractActiveLabel}
          unit={unit}
          period={period}
          isEmptyChart={isEmptyChart}
          isAwaitingRewardsData={isAwaitingRewardsData}
          isContractActive={isContractActive}
          onPeriodChange={onPeriodChange}
          onUnitChange={onUnitChange}
        />
        {showData && (
          <View className="mt-5">
            <EarningsDisplay earnings={data.earnings} />
          </View>
        )}
      </View>
    </View>
  );
}
