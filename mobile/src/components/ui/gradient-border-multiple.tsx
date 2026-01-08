import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { ColorValue, StyleProp, View, ViewStyle } from "react-native";
import { angleToPoints } from "./gradient-border";

export type GradientLayer = {
  colors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  thickness: number;
  angle?: number;
  style?: StyleProp<ViewStyle>;
};

type GradientBorderMultipleProps = PropsWithChildren<{
  layers: readonly GradientLayer[];
  borderRadius?: number;
  innerBackground?: string;
  contentStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}>;

export function GradientBorderMultiple({
  children,
  layers,
  borderRadius = 16,
  innerBackground = "#EAE8E6",
  contentStyle,
  containerStyle,
}: GradientBorderMultipleProps) {
  const layersInnerToOuter = [...layers].reverse();

  let acc = 0;

  let node = (
    <View
      style={[
        {
          borderRadius,
          backgroundColor: innerBackground,
          overflow: "hidden",
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  for (const layer of layersInnerToOuter) {
    acc += layer.thickness;
    const { start, end } = angleToPoints(layer.angle ?? -94);

    node = (
      <LinearGradient
        key={acc}
        colors={layer.colors}
        start={start}
        end={end}
        style={[
          {
            borderRadius: borderRadius + acc,
            padding: layer.thickness,
            overflow: "hidden", // for android corner clipping
          },
          layer.style,
        ]}
      >
        {node}
      </LinearGradient>
    );
  }

  return <View style={containerStyle}>{node}</View>;
}
