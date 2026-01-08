import colors, { shadows } from "@/components/ui/colors";
import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { ColorValue, StyleProp, View, ViewStyle } from "react-native";

type GradientBorderProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  gradient: readonly [ColorValue, ColorValue, ...ColorValue[]];
  shadow?: ViewStyle;
  innerBackground?: string;
  angle?: number;
  hasShadow?: boolean;
}>;

export function angleToPoints(angle: number) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad);

  return {
    start: { x: 0.5 - x / 2, y: 0.5 - y / 2 },
    end: { x: 0.5 + x / 2, y: 0.5 + y / 2 },
  };
}
export default function GradientBorder({
  children,
  style,
  borderRadius = 12, // ~ rounded-lg
  gradient = colors.stacks.borderGradientBloodOrangeCard,
  shadow = shadows.bloodOrangeCard,
  innerBackground = "#EAE8E6",
  angle = -94,
  hasShadow = true,
}: GradientBorderProps) {
  const { start, end } = angleToPoints(angle);
  return (
    <View style={hasShadow ? shadow : undefined}>
      <LinearGradient
        colors={gradient}
        // angle(-205deg) ≈ start/end like this:
        start={start}
        end={end}
        style={[shadow, { borderRadius, padding: 1 }]}
      >
        <View
          style={[
            { borderRadius, backgroundColor: innerBackground },
            { overflow: "hidden" },
            style,
          ]}
        >
          {children}
        </View>
      </LinearGradient>
    </View>
  );
}
