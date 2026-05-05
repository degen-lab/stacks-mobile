import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColorScheme } from "nativewind";

export interface AppleIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppleIcon({
  size = 24,
  color,
  className,
  style,
}: AppleIconProps) {
  const { colorScheme } = useColorScheme();
  const fillColor = color ?? (colorScheme === "dark" ? "#FFFFFF" : "#000000");

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 814 1000"
      className={className}
      style={style}
    >
      <Path
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.5 269-317.5 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.1 189.2-49.1 30.4 0 108.2 2.6 168.6 81.3zm-119.3-88.5c-28.1-36.2-75.4-63.8-120.9-63.8-5.5 0-11 .4-16.4 1.2 1.1-5.2 1.6-10.5 1.6-15.8 0-45.4-16.8-93.2-49.5-131.1C449.1 4.2 393.4-14.5 341.4 12c0 5.7-.4 11.5-.4 17.2 0 47.6 17.4 95.8 49.7 129.6 32.2 33.6 85.1 58.2 134.2 58.2 6.1 0 12.2-.4 18.1-1.3-1.1 5.7-1.6 11.5-1.6 17.1-.2 4-.1 8.1.4 12.1z"
        fill={fillColor}
      />
    </Svg>
  );
}
