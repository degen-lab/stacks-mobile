import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors } from ".";

interface DummyChartProps {
  hasBalance: boolean;
}

const Chart = ({ hasBalance }: DummyChartProps) => {
  const width = 120;
  const height = 50;
  const zeroLineY = 42;

  // A wavy path resembling the image
  const positivePath = `M0,${height} L0,40 C20,35 40,25 60,30 C80,35 100,10 120,5 L120,${height} Z`;
  // A simple flat line near the bottom
  const zeroPath = `M0,${height} L0,${zeroLineY} L120,${zeroLineY} L120,${height} Z`;

  const activePath = hasBalance ? positivePath : zeroPath;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop
            offset="0"
            stopColor={colors.stacks.bloodOrange}
            stopOpacity={0.47}
          />
          <Stop
            offset="1"
            stopColor={colors.stacks.accent[100]}
            stopOpacity={0.47}
          />
        </LinearGradient>
      </Defs>

      {/* The filled area gradient */}
      <Path d={activePath} fill="url(#grad)" />

      {/* The stroke line on top (only show if there is balance for effect) */}
      {hasBalance && (
        <Path
          d="M0,40 C20,35 40,25 60,30 C80,35 100,10 120,5"
          fill="none"
          stroke={colors.stacks.bloodOrange}
          strokeWidth={2}
          strokeDasharray="4 4" // Makes it dashed like the image
        />
      )}
      {!hasBalance && (
        <Path
          d={`M0,${zeroLineY} L120,${zeroLineY}`}
          fill="none"
          stroke={colors.stacks.bloodOrange}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      )}
    </Svg>
  );
};

export default Chart;
