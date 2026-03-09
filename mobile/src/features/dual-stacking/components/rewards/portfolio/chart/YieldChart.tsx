import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { CartesianChart, Area, Line, useChartPressState } from "victory-native";
import {
  useFont,
  LinearGradient,
  vec,
  DashPathEffect,
  Text as SkiaText,
} from "@shopify/react-native-skia";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import colors from "@/components/ui/colors";
import type { YieldChartPoint } from "@/features/dual-stacking/hooks/useYieldChartData";
import type { Unit } from "./UnitToggle";

const COLOR_MAP = {
  base: "#FC6432",
  boosted: "#FF8C42",
  stx: "#595754",
};

const EMPTY_TICKS = [4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0];

function roundUpToHalf(x: number) {
  return Math.ceil(x * 2) / 2;
}

function formatXAxisLabel(label: unknown) {
  const value = String(label ?? "");
  if (!value || value === "undefined" || value === "null") {
    return "";
  }

  return value;
}

function getXAxisTickValues(length: number) {
  if (length <= 0) return [];
  if (length <= 2) return Array.from({ length }, (_, index) => index);

  const step = Math.max(1, Math.floor((length - 1) / 3));
  const ticks = new Set<number>([0, length - 1]);

  for (let index = step; index < length - 1; index += step) {
    ticks.add(index);
  }

  return Array.from(ticks).sort((a, b) => a - b);
}

function getLabelWidth(font: ReturnType<typeof useFont>, label: string) {
  if (!font || !label) return 0;

  const glyphWidths = font.getGlyphWidths?.(font.getGlyphIDs(label)) ?? [];
  return glyphWidths.reduce((sum, width) => sum + width, 0);
}

interface Props {
  chartData: YieldChartPoint[];
  unit?: Unit;
  timeUntilCycleStartLabel?: string;
  timeUntilContractActiveLabel?: string;
  isEmpty?: boolean;
  isContractActive?: boolean;
}

function EmptyState({ label, ticks }: { label: string; ticks: number[] }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyTicks}>
        {ticks.map((tick) => (
          <View key={tick} style={styles.tickRow}>
            <Text
              className="font-instrument-sans text-xs"
              style={{ color: "#95918C", width: 32, textAlign: "right" }}
            >
              {tick}%
            </Text>
            <View style={styles.dashedLine} />
          </View>
        ))}
      </View>
      <View style={styles.emptyOverlay}>
        <Text className="font-instrument-sans-medium text-tertiary text-center text-sm leading-5">
          {label}
        </Text>
      </View>
    </View>
  );
}

function TooltipCard({
  point,
  isAprView,
}: {
  point: YieldChartPoint;
  isAprView: boolean;
}) {
  return (
    <View style={styles.tooltip}>
      <Text
        className="font-instrument-sans-medium text-sm"
        style={{ color: "#303030", marginBottom: 2 }}
      >
        Cycle {point.cycle}
      </Text>
      <Text
        className="font-instrument-sans text-xs"
        style={{ color: "#95918C", marginBottom: 8 }}
      >
        {point.display}
      </Text>

      {point.isStacking && (
        <View style={styles.tooltipRow}>
          <Text
            className="font-instrument-sans-medium text-xs"
            style={{ color: COLOR_MAP.stx }}
          >
            STX Stacking:
          </Text>
          <Text
            className="font-matter-mono text-xs"
            style={{ color: "#303030" }}
          >
            {isAprView
              ? `${point.cumulativeStacking.toFixed(2)}%`
              : `${point.rewardedStacking.toFixed(8)} sBTC`}
          </Text>
        </View>
      )}
      {(isAprView ? point.boostedApr : point.boostedSbtc) > 0 && (
        <View style={styles.tooltipRow}>
          <Text
            className="font-instrument-sans-medium text-xs"
            style={{ color: COLOR_MAP.boosted }}
          >
            sBTC Boosted:
          </Text>
          <Text
            className="font-matter-mono text-xs"
            style={{ color: "#303030" }}
          >
            {isAprView
              ? `${point.boostedApr.toFixed(2)}%`
              : `${point.boostedSbtc.toFixed(8)} sBTC`}
          </Text>
        </View>
      )}
      <View style={styles.tooltipRow}>
        <Text
          className="font-instrument-sans-medium text-xs"
          style={{ color: COLOR_MAP.base }}
        >
          sBTC Base:
        </Text>
        <Text className="font-matter-mono text-xs" style={{ color: "#303030" }}>
          {isAprView
            ? `${point.baseApr.toFixed(2)}%`
            : `${point.baseSbtc.toFixed(8)} sBTC`}
        </Text>
      </View>
      <View style={[styles.tooltipRow, styles.tooltipTotal]}>
        <Text
          className="font-instrument-sans-medium text-xs"
          style={{ color: "#303030" }}
        >
          Total {isAprView ? "APR" : "Rewards"}:
        </Text>
        <Text
          className="font-matter-mono text-xs font-semibold"
          style={{ color: "#303030" }}
        >
          {isAprView
            ? `${point.totalApr.toFixed(2)}%`
            : `${point.totalRewarded.toFixed(8)} sBTC`}
        </Text>
      </View>
    </View>
  );
}

export default function YieldChart({
  chartData,
  unit = "percent",
  timeUntilCycleStartLabel,
  timeUntilContractActiveLabel,
  isEmpty = false,
  isContractActive,
}: Props) {
  const font = useFont(
    require("@/assets/fonts/InstrumentSans-Regular.ttf"),
    11,
  );

  const isAprView = unit === "percent";

  const containerWidthSV = useSharedValue(300);

  const { state } = useChartPressState({
    x: "",
    y: { cumulativeBase: 0, cumulativeBoosted: 0, cumulativeStacking: 0 },
  });

  const [pressedIndex, setPressedIndex] = useState(-1);

  useAnimatedReaction(
    () => ({
      isActive: state.isActive.value,
      matchedIndex: state.matchedIndex.value,
    }),
    (next, previous) => {
      if (
        next.isActive &&
        (!previous ||
          !previous.isActive ||
          next.matchedIndex !== previous.matchedIndex)
      ) {
        runOnJS(setPressedIndex)(next.matchedIndex);
      }
    },
    [state.isActive, state.matchedIndex],
  );

  const pressedPoint = pressedIndex >= 0 ? chartData[pressedIndex] : null;

  // Tooltip always pinned to top so it never covers chart data
  const tooltipStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: Math.max(
      0,
      Math.min(state.x.position.value - 80, containerWidthSV.value - 184),
    ),
    top: 8,
    zIndex: 10,
  }));

  // Vertical crosshair line
  const crosshairStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: state.x.position.value,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#C8C4BF",
    zIndex: 5,
  }));

  // Active dot (outer + inner rings via two Animated.Views)
  const dotOuterStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: state.x.position.value - 5,
    top: state.y.cumulativeStacking.position.value - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLOR_MAP.stx,
    zIndex: 20,
  }));

  const dotInnerStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: state.x.position.value - 3,
    top: state.y.cumulativeStacking.position.value - 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    zIndex: 21,
  }));

  const yAxisMax = useMemo(() => {
    if (!chartData || chartData.length === 0) return isAprView ? 4 : 0.01;

    const getStackHeight = (d: YieldChartPoint) =>
      isAprView
        ? d.cumulativeStacking
        : d.baseSbtc + d.boostedSbtc + d.rewardedStacking;

    const maxVal = Math.max(...chartData.map(getStackHeight));

    if (!isAprView) {
      return Math.ceil(maxVal * 1.2 * 100000) / 100000;
    }

    const padded = maxVal * 1.2;
    const rounded = roundUpToHalf(padded);
    return Math.max(4, rounded);
  }, [chartData, isAprView]);

  const xTickValues = useMemo(
    () => getXAxisTickValues(chartData.length),
    [chartData.length],
  );

  if (!isContractActive) {
    return (
      <EmptyState
        ticks={EMPTY_TICKS}
        label={`Your first Dual Stacking rewards cycle will start in ${timeUntilContractActiveLabel}.`}
      />
    );
  }

  if (chartData.length === 0 && isEmpty) {
    return (
      <EmptyState
        ticks={EMPTY_TICKS}
        label={`Your first Dual Stacking rewards cycle is in progress.\nCheck back in ${timeUntilCycleStartLabel ?? "~0 minutes"} to view your rewards.`}
      />
    );
  }

  const formatYLabel = (value: number) => {
    if (!isAprView) {
      if (value >= 1) return value.toFixed(2);
      if (value >= 0.01) return value.toFixed(4);
      return value.toFixed(6);
    }
    return `${value.toFixed(1)}%`;
  };

  return (
    <View
      style={styles.chartContainer}
      onLayout={(e) => {
        containerWidthSV.value = e.nativeEvent.layout.width;
      }}
    >
      <CartesianChart
        data={chartData as unknown as Record<string, unknown>[]}
        xKey={"display" as never}
        yKeys={
          [
            "cumulativeBase",
            "cumulativeBoosted",
            "cumulativeStacking",
          ] as never[]
        }
        domain={{ y: [0, yAxisMax] }}
        xAxis={{
          font,
          formatXLabel: () => "",
          labelColor: "#95918C",
          lineColor: "transparent",
          tickCount: Math.max(xTickValues.length, 1),
          tickValues: xTickValues,
        }}
        axisOptions={{
          font,
          formatYLabel: formatYLabel as (label: unknown) => string,
          labelColor: "#95918C",
          lineColor: {
            grid: { x: "transparent", y: "#D5D3D1" },
            frame: "transparent",
          },
          tickCount: { x: Math.max(xTickValues.length, 1), y: 5 },
        }}
        chartPressState={state as never}
        gestureLongPressDelay={1}
        renderOutside={({ xScale, chartBounds }) => {
          if (!font) return null;

          const labelY = chartBounds.bottom + 2 + font.getSize();

          return (
            <>
              {xTickValues.map((tickValue, tickIndex) => {
                const point = chartData[tickValue];
                const label = formatXAxisLabel(point?.display);

                if (!point || !label) return null;

                const labelWidth = getLabelWidth(font, label);
                const centeredX = xScale(tickValue) - labelWidth / 2;
                const isFirstTick = tickIndex === 0;
                const isLastTick = tickIndex === xTickValues.length - 1;
                const labelX = isFirstTick
                  ? chartBounds.left
                  : isLastTick
                    ? chartBounds.right - labelWidth
                    : Math.min(
                        Math.max(centeredX, chartBounds.left),
                        chartBounds.right - labelWidth,
                      );

                return (
                  <SkiaText
                    key={`x-label-${tickValue}`}
                    color="#95918C"
                    font={font}
                    text={label}
                    x={labelX}
                    y={labelY}
                  />
                );
              })}
            </>
          );
        }}
      >
        {({ points: _points, chartBounds }) => {
          const points = _points as unknown as Record<
            string,
            Parameters<typeof Area>[0]["points"]
          >;
          return (
            <>
              {/* STX Stacking — bottom layer, full height */}
              <Area
                points={points.cumulativeStacking}
                y0={chartBounds.bottom}
                animate={{ type: "timing", duration: 300 }}
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={["rgba(12,12,13,0.4)", "rgba(149,145,140,1)"]}
                />
              </Area>
              <Line
                points={points.cumulativeStacking}
                strokeWidth={2}
                color={COLOR_MAP.stx}
                animate={{ type: "timing", duration: 300 }}
              />

              {/* Boosted layer */}
              <Area
                points={points.cumulativeBoosted}
                y0={chartBounds.bottom}
                animate={{ type: "timing", duration: 300 }}
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={["rgba(255,173,101,1)", "rgba(225,124,24,1)"]}
                />
              </Area>
              <Line
                points={points.cumulativeBoosted}
                strokeWidth={2}
                color={COLOR_MAP.boosted}
                animate={{ type: "timing", duration: 300 }}
              />

              {/* Base layer — dashed stroke */}
              <Area
                points={points.cumulativeBase}
                y0={chartBounds.bottom}
                animate={{ type: "timing", duration: 300 }}
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={["rgba(252,100,50,0.4)", "rgba(255,194,168,0.4)"]}
                />
              </Area>
              <Line
                points={points.cumulativeBase}
                strokeWidth={2}
                color={COLOR_MAP.base}
                animate={{ type: "timing", duration: 300 }}
              >
                <DashPathEffect intervals={[5, 5]} />
              </Line>
            </>
          );
        }}
      </CartesianChart>

      {pressedPoint && (
        <Animated.View style={crosshairStyle} pointerEvents="none" />
      )}
      {pressedPoint && (
        <Animated.View style={dotOuterStyle} pointerEvents="none" />
      )}
      {pressedPoint && (
        <Animated.View style={dotInnerStyle} pointerEvents="none" />
      )}
      {pressedPoint && (
        <Animated.View style={tooltipStyle}>
          <TooltipCard point={pressedPoint} isAprView={isAprView} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    width: "100%",
    height: 300,
  },
  emptyContainer: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  emptyTicks: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  tickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D5D3D1",
  },
  emptyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  tooltip: {
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    padding: 12,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
  tooltipTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    marginTop: 4,
    paddingTop: 4,
    marginBottom: 0,
  },
});
