import { StyleProp, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

export interface StarIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function StarIcon({
  size = 18,
  color = "#FC6432",
  className,
  style,
}: StarIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 15 15"
      fill="none"
      className={className}
      style={style}
    >
      <Path
        d="M8.49902 4.57617C8.60612 4.84774 8.69616 5.08603 8.81348 5.29785L8.94141 5.50098C9.09548 5.71613 9.28386 5.90451 9.49902 6.05859C9.75931 6.24498 10.0616 6.35812 10.4238 6.50098L12.9561 7.5L10.4238 8.49902C10.1522 8.60614 9.91396 8.69617 9.70215 8.81348L9.49902 8.94141C9.33768 9.05693 9.19152 9.19184 9.06348 9.34277L8.94141 9.49902C8.75492 9.75938 8.64182 10.0617 8.49902 10.4238L7.5 12.9561L6.50098 10.4238C6.35812 10.0616 6.24498 9.75931 6.05859 9.49902C5.94306 9.33769 5.80815 9.19152 5.65723 9.06348L5.50098 8.94141C5.24063 8.75492 4.93818 8.64179 4.57617 8.49902L2.04297 7.5L4.57617 6.50098C4.93834 6.35814 5.24069 6.245 5.50098 6.05859C5.71612 5.9045 5.9045 5.71612 6.05859 5.50098C6.245 5.24069 6.35814 4.93834 6.50098 4.57617L7.5 2.04297L8.49902 4.57617Z"
        stroke="url(#paint0_linear_224_9791)"
        strokeWidth="1.5"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_224_9791"
          x1="-3.91155e-07"
          y1="11.25"
          x2="17.5"
          y2="-5.41667"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FF9835" />
          <Stop offset="1" stopColor="#FC6432" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
