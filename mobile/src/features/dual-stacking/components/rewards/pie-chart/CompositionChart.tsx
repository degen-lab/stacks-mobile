import Svg, { Circle, Line, Path } from "react-native-svg";
import { View } from "react-native";
import type { YieldCompositionChartDatum } from "./types";

type YieldCompositionChartProps = {
  data: YieldCompositionChartDatum[];
};

const CHART_SIZE = 160;
const VIEWBOX_SIZE = 100;
const CENTER = 50;
const RADIUS = 50;

function clampPercentage(value: number) {
  return Math.max(0, Math.min(value, 100));
}

export function YieldCompositionChart({ data }: YieldCompositionChartProps) {
  if (data.length === 0) {
    return null;
  }

  const total = data.reduce((sum, item) => sum + item.percentage, 0);

  if (data.length === 1) {
    const [segment] = data;
    const linePercentage = clampPercentage(segment?.linePercentage ?? 0);
    const lineAngle = (linePercentage / 100) * 360;
    const radians = (lineAngle * Math.PI) / 180;
    const x = CENTER + RADIUS * Math.cos(radians);
    const y = CENTER + RADIUS * Math.sin(radians);

    return (
      <View
        className="items-center justify-center self-center"
        style={{ width: CHART_SIZE, height: CHART_SIZE }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        >
          <Circle
            testID="composition-single-segment"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill={segment?.color}
          />
          {linePercentage > 0 ? (
            <Line
              testID="composition-indicator-line"
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke={segment?.indicatorColor ?? segment?.color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      </View>
    );
  }

  let currentAngle = 0;
  const segments = data.map((item) => {
    const percentage = total ? (item.percentage / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const segmentWithAngles = { ...item, startAngle: currentAngle, angle };
    currentAngle += angle;
    return segmentWithAngles;
  });

  return (
    <View
      className="items-center justify-center self-center"
      style={{ width: CHART_SIZE, height: CHART_SIZE }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      >
        {segments.map((segment, index) => {
          if (segment.angle >= 360) {
            return (
              <Circle
                key={`${segment.name}-${index}`}
                testID={`composition-segment-${index}`}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill={segment.color}
              />
            );
          }

          const startRad = (segment.startAngle * Math.PI) / 180;
          const endRad = ((segment.startAngle + segment.angle) * Math.PI) / 180;

          const x1 = CENTER + RADIUS * Math.cos(startRad);
          const y1 = CENTER + RADIUS * Math.sin(startRad);
          const x2 = CENTER + RADIUS * Math.cos(endRad);
          const y2 = CENTER + RADIUS * Math.sin(endRad);

          const largeArcFlag = segment.angle > 180 ? 1 : 0;
          const pathData = [
            `M ${CENTER} ${CENTER}`,
            `L ${x1} ${y1}`,
            `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            "Z",
          ].join(" ");

          return (
            <Path
              key={`${segment.name}-${index}`}
              testID={`composition-segment-${index}`}
              d={pathData}
              fill={segment.color}
            />
          );
        })}
      </Svg>
    </View>
  );
}
