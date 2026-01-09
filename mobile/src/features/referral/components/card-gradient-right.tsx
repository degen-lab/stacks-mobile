import { colors, Text, View } from "@/components/ui";
import { LinearGradient } from "expo-linear-gradient";
import { ColorValue } from "react-native";

type Gradient = "blood-orange" | "bitcoin";

type StatCardProps = {
  value: number | string;
  label: string;
  gradient: Gradient;
};

const GRADIENT_MAP: Record<Gradient, readonly string[]> = {
  "blood-orange": colors.stacks.gameCardFillRight,
  bitcoin: colors.stacks.menuFillBottom,
};

export default function StatCard({ value, label, gradient }: StatCardProps) {
  return (
    <View className="flex-1 rounded-xl p-4 border border-surface-secondary bg-sand-100 overflow-hidden">
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
      <Text className="text-2xl font-matter text-primary">{value}</Text>
      <Text className="font-instrument-sans-medium uppercase text-xs text-secondary mt-1">
        {label}
      </Text>
    </View>
  );
}
