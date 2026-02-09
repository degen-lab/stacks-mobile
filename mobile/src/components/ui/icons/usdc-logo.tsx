import Svg, { SvgProps } from "react-native-svg";

export interface UsdcLogoProps extends SvgProps {
  size?: number;
}

export const UsdcLogo = ({ size = 24, ...props }: UsdcLogoProps) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* TODO: Future features */}
    </Svg>
  );
};
