import { LinearGradient } from "expo-linear-gradient";
import { ColorValue } from "react-native";

import { colors, Text, View } from "@/components/ui";

const GRADIENT_MAP = {
  "blood-orange": colors.stacks.gameCardFillRight,
  bitcoin: colors.stacks.menuFillBottom,
} as const;

type StatPillProps = {
  label: string;
  value: string | number;
  suffix?: string;
  gradient?: keyof typeof GRADIENT_MAP;
};

export default function StatPill({
  label,
  value,
  suffix,
  gradient = "blood-orange",
}: StatPillProps) {
  return (
    <View className="flex-1 rounded-xl border border-surface-secondary bg-sand-100 p-4 overflow-hidden">
      <LinearGradient
        colors={
          GRADIENT_MAP[gradient] as readonly [
            ColorValue,
            ColorValue,
            ...ColorValue[],
          ]
        }
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 0.7 }}
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "35%",
        }}
      />
      <Text className="mb-1.5 text-xs font-instrument-sans-medium uppercase text-secondary">
        {label}
      </Text>
      <Text className="text-2xl font-matter text-primary">
        {value}
        {suffix ? (
          <Text className="text-sm font-normal text-secondary"> {suffix}</Text>
        ) : null}
      </Text>
    </View>
  );
}
