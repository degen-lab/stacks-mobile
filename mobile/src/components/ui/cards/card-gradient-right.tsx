import { Text, View } from "@/components/ui";
import colors from "../colors";
import { LinearGradient } from "expo-linear-gradient";
import { ColorValue } from "react-native";

type Gradient = "blood-orange" | "bitcoin";
type LabelPosition = "top" | "bottom";

type CardGradientRightProps = {
  value: number | string;
  label: string;
  gradient?: Gradient;
  labelPosition?: LabelPosition;
  suffix?: string;
};

const GRADIENT_MAP: Record<Gradient, readonly string[]> = {
  "blood-orange": colors.stacks.gameCardFillRight,
  bitcoin: colors.stacks.menuFillBottom,
};

export function CardGradientRight({
  value,
  label,
  gradient = "blood-orange",
  labelPosition = "bottom",
  suffix,
}: CardGradientRightProps) {
  const labelClasses =
    labelPosition === "top"
      ? "mb-1.5 text-xs font-instrument-sans-medium uppercase text-secondary"
      : "mt-1 text-xs font-instrument-sans-medium uppercase text-secondary";

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
      {labelPosition === "top" ? (
        <Text className={labelClasses}>{label}</Text>
      ) : null}
      <Text className="text-2xl font-matter text-primary">
        {value}
        {suffix ? (
          <Text className="text-sm font-normal text-secondary"> {suffix}</Text>
        ) : null}
      </Text>
      {labelPosition === "bottom" ? (
        <Text className={labelClasses}>{label}</Text>
      ) : null}
    </View>
  );
}
