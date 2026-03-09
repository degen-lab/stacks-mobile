import React from "react";
import Svg, { Circle } from "react-native-svg";

type Props = {
  size?: number;
  strokeColor?: string;
  strokeWidth?: number;
  dashArray?: string;
};

export function DashedCircle({
  size = 32,
  strokeColor = "currentColor",
  strokeWidth = 2,
  dashArray = "2 4",
}: Props) {
  const r = size / 2 - strokeWidth;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
      />
    </Svg>
  );
}
