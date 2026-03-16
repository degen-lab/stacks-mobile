import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path, type SvgProps } from "react-native-svg";

const DEFAULT_WIDTH = 17;
const DEFAULT_HEIGHT = 16;

export interface StarIconProps extends Omit<
  SvgProps,
  "width" | "height" | "color"
> {
  size?: number;
  width?: number | string;
  height?: number | string;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function StarIcon({
  size,
  width,
  height,
  color = "#95918C",
  className,
  style,
  ...props
}: StarIconProps) {
  const resolvedWidth = width ?? size ?? DEFAULT_WIDTH;
  const resolvedHeight =
    height ?? (size ? (size * DEFAULT_HEIGHT) / DEFAULT_WIDTH : DEFAULT_HEIGHT);

  return (
    <Svg
      width={resolvedWidth}
      height={resolvedHeight}
      viewBox="0 0 17 16"
      fill="none"
      className={className}
      style={style}
      {...props}
    >
      <Path
        d="M16.1675 7.32255L12.8337 10.1993L13.8494 14.5015C13.9054 14.735 13.891 14.9799 13.8079 15.2053C13.7248 15.4306 13.5768 15.6263 13.3826 15.7676C13.1884 15.9089 12.9566 15.9894 12.7167 15.999C12.4767 16.0087 12.2392 15.9469 12.0343 15.8217L8.29295 13.5191L4.54939 15.8217C4.34449 15.9462 4.10732 16.0073 3.86775 15.9974C3.62818 15.9874 3.39693 15.9067 3.2031 15.7656C3.00927 15.6244 2.86154 15.4291 2.77851 15.2041C2.69549 14.9792 2.68087 14.7347 2.7365 14.5015L3.75593 10.1993L0.422059 7.32255C0.240769 7.16587 0.109657 6.95925 0.0450962 6.72849C-0.0194641 6.49774 -0.0146113 6.25308 0.0590485 6.02506C0.132708 5.79705 0.271911 5.59579 0.459271 5.44642C0.646632 5.29705 0.873846 5.20618 1.11254 5.18517L5.48361 4.83252L7.16981 0.751869C7.26108 0.529476 7.41642 0.339247 7.61608 0.205366C7.81574 0.0714847 8.0507 0 8.2911 0C8.53149 0 8.76646 0.0714847 8.96612 0.205366C9.16578 0.339247 9.32112 0.529476 9.41239 0.751869L11.0978 4.83252L15.4689 5.18517C15.7081 5.2054 15.936 5.29576 16.124 5.44492C16.312 5.59409 16.4519 5.79543 16.526 6.02372C16.6001 6.25201 16.6052 6.4971 16.5407 6.72827C16.4761 6.95945 16.3448 7.16643 16.1631 7.32329L16.1675 7.32255Z"
        fill={color}
      />
    </Svg>
  );
}
