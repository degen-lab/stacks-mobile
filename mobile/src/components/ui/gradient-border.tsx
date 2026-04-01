import colors, { shadows } from "@/components/ui/colors";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "nativewind";
import { PropsWithChildren } from "react";
import { ColorValue, StyleProp, View, ViewStyle } from "react-native";

type GradientBorderProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  borderBottomRightRadius?: number;
  borderWidth?: number;
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
  borderBottomRightRadius = 12,
  borderWidth = 1,
  gradient = colors.stacks.borderGradientBloodOrangeCard,
  shadow = shadows.bloodOrangeCard,
  innerBackground,
  angle = -94,
  hasShadow = true,
}: GradientBorderProps) {
  const { colorScheme } = useColorScheme();
  const resolvedInnerBackground =
    innerBackground ??
    resolveThemeTokenColor(
      colorScheme === "dark" ? "dark" : "light",
      "--color-surface-primary",
    );
  const { start, end } = angleToPoints(angle);
  return (
    <View style={hasShadow ? shadow : undefined}>
      <LinearGradient
        colors={gradient}
        // angle(-205deg) ≈ start/end like this:
        start={start}
        end={end}
        style={[
          shadow,
          { borderRadius, borderBottomRightRadius, padding: borderWidth },
        ]}
      >
        <View
          style={[
            {
              borderRadius:
                borderWidth > 1
                  ? Math.max(borderRadius - borderWidth, 0)
                  : borderRadius,
              borderBottomRightRadius:
                borderWidth > 1
                  ? Math.max(borderBottomRightRadius - borderWidth, 0)
                  : borderBottomRightRadius,
              backgroundColor: resolvedInnerBackground,
            },
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
