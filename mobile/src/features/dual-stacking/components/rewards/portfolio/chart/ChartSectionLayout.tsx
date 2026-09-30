import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { TimeToggle } from "./TimeToggle";
import { UnitToggle, type Unit } from "./UnitToggle";
import { ChartLegend } from "./Legend";
import YieldChart from "./YieldChart";
import type { ChartLegendItem, TimePeriod } from "./types";
import type { YieldChartPoint } from "@/features/dual-stacking/hooks/use-yield-chart-data";

interface Props {
  chartData: YieldChartPoint[];
  unit: Unit;
  period: TimePeriod;
  timeUntilCycleStartLabel: string;
  timeUntilContractActiveLabel: string;
  legendItems: ChartLegendItem[];
  onUnitChange: (unit: Unit) => void;
  onPeriodChange: (period: TimePeriod) => void;
  isEmptyChart: boolean;
  isAwaitingRewardsData?: boolean;
  isContractActive?: boolean;
}

export function ChartSectionLayout({
  chartData,
  unit,
  period,
  legendItems,
  onUnitChange,
  onPeriodChange,
  isEmptyChart,
  isAwaitingRewardsData,
  isContractActive,
  timeUntilCycleStartLabel,
  timeUntilContractActiveLabel,
}: Props) {
  const showData = isContractActive && !isEmptyChart;

  return (
    <View>
      {showData && (
        <View className="mb-5 flex-row flex-wrap items-center justify-between">
          <View className="mb-3 mr-3 flex-row items-center">
            <Text className="font-instrument-sans-medium text-tertiary text-xs">
              View by:
            </Text>
            <View className="ml-2">
              <UnitToggle value={unit} onChange={onUnitChange} />
            </View>
          </View>
          <View className="mb-3">
            <TimeToggle value={period} onChange={onPeriodChange} />
          </View>
        </View>
      )}

      {showData && <ChartLegend items={legendItems} />}

      <View className="mt-6">
        <YieldChart
          chartData={chartData}
          unit={unit}
          isEmpty={isEmptyChart}
          isAwaitingRewardsData={isAwaitingRewardsData}
          isContractActive={isContractActive}
          timeUntilCycleStartLabel={timeUntilCycleStartLabel}
          timeUntilContractActiveLabel={timeUntilContractActiveLabel}
        />
      </View>
    </View>
  );
}
