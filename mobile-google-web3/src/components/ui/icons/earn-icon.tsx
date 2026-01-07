import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface EarnIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function EarnIcon({
  size = 24,
  color = "#FC6432",
  className,
  style,
}: EarnIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
    >
      <Path
        d="M19.5 15.75L4.5 15.75C4.08579 15.75 3.75 16.0858 3.75 16.5L3.75 18.75C3.75 19.1642 4.08579 19.5 4.5 19.5H19.5C19.9142 19.5 20.25 19.1642 20.25 18.75V16.5C20.25 16.0858 19.9142 15.75 19.5 15.75Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.5 9L4.5 9C4.08579 9 3.75 9.33579 3.75 9.75L3.75 12C3.75 12.4142 4.08579 12.75 4.5 12.75L19.5 12.75C19.9142 12.75 20.25 12.4142 20.25 12V9.75C20.25 9.33579 19.9142 9 19.5 9Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.75 3.75L14.25 3.75"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 1.5V6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
