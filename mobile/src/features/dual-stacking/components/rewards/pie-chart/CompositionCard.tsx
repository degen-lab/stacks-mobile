import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { InfoTooltipIcon } from "@/components/ui/tooltip-info";
import type { YieldSource } from "./types";
import { YieldCompositionChart } from "./CompositionChart";
import { YieldSourceItem } from "./SourceItem";

type YieldCompositionCardProps = {
  sources: YieldSource[];
};

export function YieldCompositionCard({ sources }: YieldCompositionCardProps) {
  return (
    <View className="border-border-secondary rounded-xl border bg-sand-100 pt-3 pb-6">
      <View className="flex-row items-end justify-between px-3 pt-2">
        <Text className="font-instrument-sans-medium text-secondary text-base leading-6">
          Rewards composition
        </Text>
        <InfoTooltipIcon
          content="Breakdown of your yield sources"
          size="sm"
          ariaLabel="More information about rewards composition"
        />
      </View>

      <View className="gap-5 px-4 pt-5">
        <YieldCompositionChart
          data={sources.map((source) => ({
            name: source.name,
            percentage: source.percentage,
            color: source.chartColor ?? source.color,
            indicatorColor: source.indicatorColor ?? source.color,
            linePercentage: source.apy,
          }))}
        />

        <View>
          {sources.map((source, index) => (
            <YieldSourceItem
              key={source.id}
              source={source}
              isLast={index === sources.length - 1}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
