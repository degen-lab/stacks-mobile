import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { formatCompactNumber } from "@/lib/format/decimal";
import type { YieldSource } from "./types";

type YieldSourceItemProps = {
  source: YieldSource;
  isLast?: boolean;
};

export function YieldSourceItem({
  source,
  isLast = false,
}: YieldSourceItemProps) {
  const { color, name, percentage, apy, valueForApyCalculation } = source;

  return (
    <View
      className={`flex-row items-start gap-3 py-3 ${isLast ? "" : "border-b border-border-secondary"}`}
    >
      <View
        className="mt-1 h-3 w-3 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <View className="flex-1">
        <View className="mb-1 flex-row flex-wrap items-center gap-1">
          <Text className="font-instrument-sans-medium text-primary text-sm">
            {name}
          </Text>
          <Text className="font-instrument-sans-medium text-secondary text-sm">
            ({percentage}%)
          </Text>
        </View>
        <Text className="font-instrument-sans-medium text-secondary text-xs leading-5">
          {formatCompactNumber(valueForApyCalculation)} {source.currency}{" "}
          earning {apy}% APY
        </Text>
      </View>
    </View>
  );
}
