import Svg, { Path } from "react-native-svg";

type Props = {
  width?: number | string;
  height?: number | string;
  color?: string;
};

export function CurrencyBtcIcon({
  width = 16,
  height = 16,
  color = "#595754",
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 15 14" fill="none">
      <Path
        d="M4.55859 2.625H5.43359"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.55859 10.9375H5.43359"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.74609 2.625V1.3125"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.49609 2.625V1.3125"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.74609 12.25V10.9375"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.49609 12.25V10.9375"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.43359 6.5625H9.37109C9.95125 6.5625 10.5077 6.79297 10.9179 7.2032C11.3281 7.61344 11.5586 8.16984 11.5586 8.75C11.5586 9.33016 11.3281 9.88656 10.9179 10.2968C10.5077 10.707 9.95125 10.9375 9.37109 10.9375H5.43359L5.43359 2.625L8.71484 2.625C9.23699 2.625 9.73775 2.83242 10.107 3.20163C10.4762 3.57085 10.6836 4.07161 10.6836 4.59375C10.6836 5.11589 10.4762 5.61665 10.107 5.98587C9.73775 6.35508 9.23699 6.5625 8.71484 6.5625"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
