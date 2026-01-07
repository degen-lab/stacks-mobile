import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface HomeIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function HomeIcon({
  size = 24,
  color = "#FC6432",
  className,
  style,
}: HomeIconProps) {
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
        d="M7.5 10.5C9.15685 10.5 10.5 9.15685 10.5 7.5C10.5 5.84315 9.15685 4.5 7.5 4.5C5.84315 4.5 4.5 5.84315 4.5 7.5C4.5 9.15685 5.84315 10.5 7.5 10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 10.5C18.1569 10.5 19.5 9.15685 19.5 7.5C19.5 5.84315 18.1569 4.5 16.5 4.5C14.8431 4.5 13.5 5.84315 13.5 7.5C13.5 9.15685 14.8431 10.5 16.5 10.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.5 19.5C9.15685 19.5 10.5 18.1569 10.5 16.5C10.5 14.8431 9.15685 13.5 7.5 13.5C5.84315 13.5 4.5 14.8431 4.5 16.5C4.5 18.1569 5.84315 19.5 7.5 19.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.5 13.5V19.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.5 16.5H13.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
