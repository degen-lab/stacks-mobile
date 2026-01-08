import { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

export interface HighscoreIconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function HighscoreIcon({
  size = 16,
  color = "#595754",
  className,
  style,
}: HighscoreIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      style={style}
    >
      <Path
        d="M8.00176 10.6663C4.16177 10.6663 3.48151 6.83934 3.36101 3.80399C3.32749 2.95966 3.31073 2.53749 3.62787 2.14689C3.94501 1.7563 4.32459 1.69225 5.08375 1.56417C5.83312 1.43773 6.81269 1.33301 8.00176 1.33301C9.19076 1.33301 10.1704 1.43773 10.9197 1.56417C11.6789 1.69225 12.0584 1.7563 12.3756 2.14689C12.6928 2.53749 12.676 2.95966 12.6424 3.80399C12.522 6.83934 11.8417 10.6663 8.00176 10.6663Z"
        stroke={color}
      />
      <Path
        d="M12.668 3.33301L13.3004 3.54381C13.9604 3.76383 14.2904 3.87383 14.4792 4.13573C14.668 4.39762 14.668 4.74549 14.6679 5.44123V5.48959C14.6679 6.06341 14.6679 6.35033 14.5298 6.58507C14.3916 6.81981 14.1408 6.95914 13.6392 7.23781L11.668 8.33301"
        stroke={color}
      />
      <Path
        d="M3.33394 3.33301L2.70153 3.54381C2.04149 3.76383 1.71147 3.87383 1.52272 4.13573C1.33396 4.39762 1.33396 4.74549 1.33398 5.44123V5.48959C1.334 6.06341 1.33401 6.35033 1.47214 6.58507C1.61026 6.81981 1.86107 6.95914 2.36268 7.23781L4.33394 8.33301"
        stroke={color}
      />
      <Path d="M8 11.333V12.6663" stroke={color} strokeLinecap="round" />
      <Path
        d="M10.3346 14.6667H5.66797L5.89412 13.5359C5.95644 13.2243 6.23005 13 6.54784 13H9.45477C9.77257 13 10.0462 13.2243 10.1085 13.5359L10.3346 14.6667Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 14.666H4" stroke={color} strokeLinecap="round" />
    </Svg>
  );
}
