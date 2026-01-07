import { StyleProp, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

export interface StackIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function StackIcon({ size = 18, className, style }: StackIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      style={style}
    >
      <Path
        d="M16.8706 12.2908C17.6497 12.8022 17.614 13.9881 16.7635 14.4377L10.7787 17.6012C10.2914 17.8588 9.7083 17.8588 9.22096 17.6012L3.23622 14.4377C2.38576 13.9881 2.35 12.8023 3.12895 12.2908L3.18138 12.3234L9.22088 15.5176C9.70821 15.7752 10.2914 15.7752 10.7786 15.5176L16.7634 12.3541C16.8007 12.3344 16.8365 12.3132 16.8706 12.2908ZM16.8706 8.95744C17.6158 9.44662 17.6155 10.5529 16.8698 11.0417L16.7635 11.1044L10.7787 14.2679C10.3357 14.502 9.81352 14.5233 9.3561 14.3317L9.22096 14.2679L3.23622 11.1044C2.38576 10.6548 2.35 9.46894 3.12895 8.95744L3.18138 8.99011L9.22088 12.1843C9.66391 12.4184 10.1861 12.4397 10.6435 12.2481L10.7786 12.1843L16.7634 9.02077C16.8007 9.00102 16.8365 8.97986 16.8706 8.95744ZM10.7786 2.39729L16.7634 5.56081C17.6512 6.03009 17.6512 7.30174 16.7634 7.77101L10.7786 10.9345C10.2914 11.1921 9.70821 11.1921 9.22088 10.9345L3.23616 7.77101C2.34836 7.30173 2.34836 6.03009 3.23616 5.56081L9.22088 2.39729C9.70821 2.13971 10.2914 2.13971 10.7786 2.39729Z"
        fill="url(#paint0_linear_224_9796)"
      />
      <Defs>
        <LinearGradient
          id="paint0_linear_224_9796"
          x1="10.0003"
          y1="-10.4172"
          x2="19.167"
          y2="16.6662"
          gradientUnits="userSpaceOnUse"
        >
          <Stop stopColor="#FC6432" />
          <Stop offset="1" stopColor="#FF9835" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}
