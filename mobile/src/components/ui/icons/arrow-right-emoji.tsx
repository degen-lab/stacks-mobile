import React from "react";
import Svg, { Path } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
  color?: string;
};

export default function ArrowRightEmoji({
  width = 7,
  height = 7,
  color = "#595754",
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 7 7" fill="none">
      <Path
        d="M0.13075 5.86799L5.68675 0.32399L5.56675 1.11599L-0.00124994 1.10399L1.09075 -1.0252e-05L6.79075 0.0239902L6.80275 5.72399L5.69875 6.82799V1.25999L6.49075 1.12799L0.93475 6.67199L0.13075 5.86799Z"
        fill={color}
      />
    </Svg>
  );
}
