import { colors, View } from "@/components/ui";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

const DEFAULT_BG = colors.neutral[100];

export const ClassicTicket = ({
  active,
  backgroundColor = DEFAULT_BG,
}: {
  active: boolean;
  backgroundColor?: string;
}) => {
  const activeFill = colors.neutral[900];
  const activeBorder = colors.neutral[500];
  const inactiveFill = colors.neutral[300];
  const inactiveBorder = colors.neutral[400];

  const width = 80;
  const height = 48;
  const viewBoxWidth = 120;
  const viewBoxHeight = 72;

  return (
    <View
      style={{
        width,
        height,
        marginHorizontal: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        fill="none"
      >
        <Path
          d="M10,0 H110 A10,10 0 0 1 120,10 V62 A10,10 0 0 1 110,72 H10 A10,10 0 0 1 0,62 V10 A10,10 0 0 1 10,0 Z"
          fill={active ? activeFill : inactiveFill}
        />
        <Circle cx="0" cy="36" r="8" fill={backgroundColor} />
        <Circle cx="120" cy="36" r="8" fill={backgroundColor} />
        <Rect
          x="12"
          y="6"
          width="96"
          height="60"
          rx="4"
          stroke={active ? activeBorder : inactiveBorder}
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
          opacity={active ? 1 : 0.6}
        />
        {active ? (
          <G transform="translate(42, 18)">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M24.4138 11.7914C24.2759 11.5568 24.2956 11.2634 24.4532 11.0288L31.0345 1.34927C31.2118 1.0755 31.2315 0.743074 31.0739 0.46931C30.9163 0.175991 30.6207 0.0195546 30.3054 0.0195546H27.7438C27.468 0.0195546 27.1921 0.156437 27.0148 0.410646L19.33 11.7523C19.133 12.0456 18.8177 12.2021 18.4631 12.2021H17.4975C17.1429 12.2021 16.8276 12.0261 16.6305 11.7523L8.98522 0.391092C8.82759 0.136882 8.53202 0 8.25616 0H5.69458C5.37931 0 5.06404 0.175991 4.92611 0.46931C4.76847 0.762629 4.80788 1.09506 4.96552 1.34927L11.5468 11.0483C11.7044 11.2634 11.7241 11.5568 11.5862 11.7914C11.4483 12.0456 11.2118 12.1825 10.936 12.1825H0.866995C0.374384 12.1825 0 12.5736 0 13.0429V15.1548C0 15.6437 0.394089 16.0152 0.866995 16.0152H35.133C35.6256 16.0152 36 15.6241 36 15.1548V13.0429C36 12.5932 35.665 12.2412 35.2315 12.1825C35.1921 12.1825 35.1527 12.1825 35.1133 12.1825H25.064C24.7882 12.1825 24.532 12.0456 24.4138 11.7914ZM16.6502 24.2477L8.96552 35.5894C8.80788 35.8436 8.51231 35.9804 8.23645 35.9804H5.67488C5.35961 35.9804 5.06404 35.8045 4.9064 35.5307C4.74877 35.2569 4.76847 34.9049 4.94581 34.6507L11.5074 24.9712C11.665 24.7366 11.6847 24.4628 11.5468 24.2086C11.4089 23.9739 11.1724 23.8175 10.8966 23.8175H0.866995C0.394089 23.8175 0 23.446 0 22.9571V20.8452C0 20.3759 0.374384 19.9848 0.866995 19.9848H35.0542C35.0542 19.9848 35.1133 19.9848 35.133 19.9848C35.6059 19.9848 36 20.3563 36 20.8452V22.9571C36 23.4264 35.6256 23.8175 35.133 23.8175H25.0837C24.7882 23.8175 24.5517 23.9544 24.4335 24.2086C24.2956 24.4628 24.3153 24.7366 24.4729 24.9517L31.0542 34.6507C31.2118 34.9049 31.2512 35.2374 31.0936 35.5307C30.936 35.824 30.6404 36 30.3251 36H27.7635C27.468 36 27.2118 35.8631 27.0542 35.6285L19.3695 24.2868C19.1724 23.9935 18.8571 23.837 18.5025 23.837H17.5369C17.1823 23.837 16.867 24.013 16.67 24.2868L16.6502 24.2477Z"
              fill="#FFFFFF"
            />
          </G>
        ) : null}
      </Svg>
    </View>
  );
};

type RaffleEntryIndicatorProps = {
  submittedEntries: number;
  totalSlots?: number;
  backgroundColor?: string;
};

export default function RaffleEntryIndicator({
  submittedEntries,
  totalSlots = 3,
  backgroundColor = DEFAULT_BG,
}: RaffleEntryIndicatorProps) {
  return (
    <View className="flex-row items-start justify-between px-2 w-full">
      {Array.from({ length: totalSlots }).map((_, index) => {
        const isActive = index < submittedEntries;
        return (
          <ClassicTicket
            key={index}
            active={isActive}
            backgroundColor={backgroundColor}
          />
        );
      })}
    </View>
  );
}
