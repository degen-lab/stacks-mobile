import Svg, { Path } from "react-native-svg";

interface ClockCountdownProps {
  size?: number;
  color?: string;
}

export function ClockCountdown({
  size = 20,
  color = "#595754",
}: ClockCountdownProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.5 10.625C17.182 14.475 13.932 17.5 10 17.5C8.01088 17.5 6.10322 16.7098 4.6967 15.3033C3.29018 13.8968 2.5 11.9891 2.5 10C2.5 6.06797 5.525 2.81797 9.375 2.5"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 5.625V10H14.375"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.5 3.75C13.0178 3.75 13.4375 3.33027 13.4375 2.8125C13.4375 2.29473 13.0178 1.875 12.5 1.875C11.9822 1.875 11.5625 2.29473 11.5625 2.8125C11.5625 3.33027 11.9822 3.75 12.5 3.75Z"
        fill={color}
      />
      <Path
        d="M15.3125 5.625C15.8303 5.625 16.25 5.20527 16.25 4.6875C16.25 4.16973 15.8303 3.75 15.3125 3.75C14.7947 3.75 14.375 4.16973 14.375 4.6875C14.375 5.20527 14.7947 5.625 15.3125 5.625Z"
        fill={color}
      />
      <Path
        d="M17.1875 8.4375C17.7053 8.4375 18.125 8.01777 18.125 7.5C18.125 6.98223 17.7053 6.5625 17.1875 6.5625C16.6697 6.5625 16.25 6.98223 16.25 7.5C16.25 8.01777 16.6697 8.4375 17.1875 8.4375Z"
        fill={color}
      />
    </Svg>
  );
}
