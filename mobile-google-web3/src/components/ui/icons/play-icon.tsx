import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface PlayIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function PlayIcon({
  size = 15,
  color = "#0C0C0D",
  className,
  style,
}: PlayIconProps) {
  return (
    <Svg
      width={size}
      height={(size * 15) / 12}
      viewBox="0 0 12 15"
      fill="none"
      className={className}
      style={style}
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.6801 6.72899L1.31882 0.17667C0.704133 -0.148189 0 -0.114467 0 1.05171V13.954C0 15.0201 0.755402 15.1882 1.31882 14.829L11.6801 8.27673C12.1066 7.84911 12.1066 7.1566 11.6801 6.72899Z"
        fill={color}
      />
    </Svg>
  );
}
