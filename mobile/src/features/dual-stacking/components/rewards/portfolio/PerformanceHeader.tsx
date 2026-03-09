import { View } from "react-native";
import { Text } from "@/components/ui/text";
import type { PerformanceMetrics } from "./chart/types";

type Props = {
  metrics: PerformanceMetrics;
};

export function PerformanceHeader({ metrics }: Props) {
  return (
    <View>
      <Text className="font-matter text-primary text-xl">
        Portfolio performance
      </Text>
      <Text className="font-matter text-primary text-4xl mt-1">
        {metrics.percentage.toFixed(2)}%
      </Text>
      <Text className="font-instrument-sans-medium text-tertiary text-base mt-1">
        {metrics.description}
      </Text>
    </View>
  );
}
