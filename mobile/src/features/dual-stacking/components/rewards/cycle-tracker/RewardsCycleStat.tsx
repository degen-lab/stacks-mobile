import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

type RewardsCycleStatProps = {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
};

export function RewardsCycleStat({
  label,
  value,
  subValue,
  icon,
}: RewardsCycleStatProps) {
  return (
    <View className="gap-1">
      <Text className="font-instrument-sans-medium text-secondary text-sm">
        {label}
      </Text>

      <View className="flex-row items-center gap-1">
        {icon ? <View className="mb-0.5">{icon}</View> : null}

        <Text className="font-instrument-sans text-primary text-sm">
          {value}
        </Text>

        {subValue ? (
          <View className="ml-1.5 rounded-md bg-surface-primary px-1.5 py-1">
            <Text className="font-matter-mono text-primary text-xs tracking-wide">
              {subValue}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
