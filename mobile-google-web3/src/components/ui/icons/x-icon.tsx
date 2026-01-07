import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface XIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function XIcon({
  size = 24,
  color = "#595754",
  className,
  style,
}: XIconProps) {
  return (
    <Svg
      width={size}
      height={(size * 322) / 356}
      viewBox="0 0 356 322"
      fill="none"
      className={className}
      style={style}
    >
      <Path
        d="M280.335 0H334.917L215.672 136.29L355.954 321.75H246.114L160.083 209.27L61.644 321.75H7.029L134.574 175.973L0 0H112.629L190.394 102.812L280.335 0ZM261.178 289.08H291.423L96.195 30.954H63.7395L261.178 289.08Z"
        fill={color}
      />
    </Svg>
  );
}
