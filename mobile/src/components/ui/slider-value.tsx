import { LinearGradient } from "expo-linear-gradient";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View as RNView,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import colors from "./colors";
import { Text } from "./text";

type SliderGradient = readonly [string, string, ...string[]];

export interface ValueSliderProps {
  min?: number;
  max: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  currencySymbol?: ReactNode;
  showTicks?: boolean;
  className?: string;
  trackGradient?: SliderGradient;
  subtleProgressOverlay?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatTickValue(value: number) {
  if (value >= 1_000_000) {
    const formatted = value / 1_000_000;
    return formatted % 1 === 0 ? `${formatted}M` : `${formatted.toFixed(1)}M`;
  }

  if (value >= 1_000) {
    const formatted = value / 1_000;
    return formatted % 1 === 0 ? `${formatted}K` : `${formatted.toFixed(1)}K`;
  }

  return value.toString();
}

function getStepSize(max: number): number {
  if (max <= 10) return 1;
  if (max <= 1000) return 1;
  if (max <= 5000) return 50;
  if (max <= 10000) return 100;
  if (max <= 50000) return 500;
  if (max <= 100000) return 1000;
  return 5000;
}

function getTicks(min: number, max: number, desiredCount = 6) {
  if (max <= min) return [min];

  const span = max - min;
  const roughStep = span / (desiredCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;

  let niceNormalized: number;
  if (normalized <= 1) {
    niceNormalized = 1;
  } else if (normalized <= 2) {
    niceNormalized = 2;
  } else if (normalized <= 5) {
    niceNormalized = 5;
  } else {
    niceNormalized = 10;
  }

  let step = Math.max(1, niceNormalized * magnitude);
  if (span > 1_000 && span <= 10_000 && step < 500) {
    step = 500;
  }

  const ticks: number[] = [min];
  let current = Math.ceil(min / step) * step;

  while (current < max) {
    if (current > min) ticks.push(current);
    current += step;
  }

  if (ticks[ticks.length - 1] !== max) {
    ticks.push(max);
  }

  const formatted = ticks.map(formatTickValue);
  const hasDuplicates = formatted.some(
    (tick, index) => formatted.indexOf(tick) !== index,
  );

  if (!hasDuplicates) {
    return ticks;
  }

  const safeTicks: number[] = [min];
  const safeStep = step * 2;
  let safeCurrent = Math.ceil(min / safeStep) * safeStep;

  while (safeCurrent < max) {
    if (safeCurrent > min) safeTicks.push(safeCurrent);
    safeCurrent += safeStep;
  }

  if (safeTicks[safeTicks.length - 1] !== max) {
    safeTicks.push(max);
  }

  return safeTicks;
}

const DEFAULT_TRACK_GRADIENT: SliderGradient = ["#D5D3D1", "#777470"];
const LOADING_TRACK_GRADIENT: SliderGradient = [
  "#D5D3D1",
  "#B8B6B3",
  "#D5D3D1",
];
const SLIDER_HEIGHT = 24;
const TRACK_HEIGHT = 3;
const END_DOT_SIZE = 10;
const CONNECTOR_HEIGHT = 14;
const CONNECTOR_WIDTH = 2;
const CONNECTOR_VISUAL_NUDGE = 5;
const DEFAULT_BUBBLE_WIDTH = 54;
const DEFAULT_BUBBLE_HEIGHT = 26;
const BUBBLE_BOTTOM_OFFSET = 28;
const TRACK_TOP = (SLIDER_HEIGHT - TRACK_HEIGHT) / 2;
const END_DOT_TOP = TRACK_TOP - (END_DOT_SIZE - TRACK_HEIGHT) / 2;
const BUBBLE_HIT_SLOP_TOP =
  DEFAULT_BUBBLE_HEIGHT + BUBBLE_BOTTOM_OFFSET - SLIDER_HEIGHT;
const BUBBLE_BORDER_GRADIENT: SliderGradient = ["#D5D3D1", colors.neutral[500]];
const BUBBLE_SURFACE = "#EAE8E6";

export function ValueSlider({
  min = 0,
  max,
  value: controlledValue,
  defaultValue = 0,
  onChange,
  currencySymbol,
  showTicks = true,
  className,
  trackGradient = DEFAULT_TRACK_GRADIENT,
  subtleProgressOverlay = false,
  disabled = false,
  loading = false,
}: ValueSliderProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [trackWidth, setTrackWidth] = useState(0);
  const [bubbleWidth, setBubbleWidth] = useState(DEFAULT_BUBBLE_WIDTH);
  const [tickWidths, setTickWidths] = useState<Record<number, number>>({});
  const value = controlledValue ?? internalValue;
  const step = getStepSize(max);
  const ticks = useMemo(() => getTicks(min, max), [min, max]);
  const progress = max <= min ? 0 : clamp((value - min) / (max - min), 0, 1);
  const thumbLeft = progress * trackWidth;
  const shimmer = useSharedValue(-1);
  const isInactive = disabled || loading;

  useEffect(() => {
    if (controlledValue == null) {
      setInternalValue((prev) => clamp(prev, min, max));
    }
  }, [controlledValue, max, min]);

  useEffect(() => {
    if (!loading) {
      shimmer.value = -1;
      return;
    }

    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 1400,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [loading, shimmer]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmer.value * trackWidth * 2 }],
    };
  });

  const updateValueFromPosition = useCallback(
    (positionX: number) => {
      if (disabled || loading || trackWidth <= 0 || max <= min) return;

      const clampedX = clamp(positionX, 0, trackWidth);
      const rawValue = min + (clampedX / trackWidth) * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const nextValue = clamp(steppedValue, min, max);

      if (controlledValue == null) {
        setInternalValue(nextValue);
      }

      onChange?.(nextValue);
    },
    [controlledValue, disabled, loading, max, min, onChange, step, trackWidth],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled && !loading,
        onMoveShouldSetPanResponder: () => !disabled && !loading,
        onStartShouldSetPanResponderCapture: () => !disabled && !loading,
        onMoveShouldSetPanResponderCapture: () => !disabled && !loading,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          updateValueFromPosition(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateValueFromPosition(event.nativeEvent.locationX);
        },
        onPanResponderRelease: (event) => {
          updateValueFromPosition(event.nativeEvent.locationX);
        },
      }),
    [disabled, loading, updateValueFromPosition],
  );

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTrackWidth((prev) => (prev === width ? prev : width));
  };

  return (
    <RNView className={className}>
      <RNView className="relative py-6">
        <RNView
          className={`relative justify-center ${isInactive ? "opacity-60" : "opacity-100"}`}
          hitSlop={{
            top: BUBBLE_HIT_SLOP_TOP,
            left: 12,
            right: 12,
            bottom: 8,
          }}
          style={{ height: SLIDER_HEIGHT }}
          {...panResponder.panHandlers}
        >
          <RNView
            onLayout={handleTrackLayout}
            className="relative w-full overflow-hidden rounded-full"
            style={{ height: TRACK_HEIGHT }}
          >
            <LinearGradient
              colors={loading ? LOADING_TRACK_GRADIENT : trackGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
            />
            {loading && trackWidth > 0 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  shimmerStyle,
                  { width: trackWidth * 2 },
                ]}
              >
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(255,255,255,0.32)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </Animated.View>
            ) : null}
            {subtleProgressOverlay ? (
              <RNView
                pointerEvents="none"
                className="absolute left-0 top-0 h-full bg-white/10"
                style={{ width: `${progress * 100}%` }}
              />
            ) : null}
          </RNView>

          <RNView
            pointerEvents="none"
            className="absolute rounded-full"
            style={{
              right: -END_DOT_SIZE / 2,
              top: END_DOT_TOP,
              width: END_DOT_SIZE,
              height: END_DOT_SIZE,
              backgroundColor: colors.neutral[500],
              zIndex: 1,
            }}
          />

          <RNView
            pointerEvents="none"
            style={{
              position: "absolute",
              left: thumbLeft,
              top: TRACK_TOP - CONNECTOR_VISUAL_NUDGE,
              width: CONNECTOR_WIDTH,
              height: CONNECTOR_HEIGHT,
              backgroundColor: colors.neutral[600],
              borderRadius: 999,
              zIndex: 2,
              transform: [{ translateX: -CONNECTOR_WIDTH / 2 }],
            }}
          />

          {!loading ? (
            <RNView
              pointerEvents="none"
              style={{
                position: "absolute",
                left: thumbLeft,
                bottom: BUBBLE_BOTTOM_OFFSET,
                transform: [{ translateX: -bubbleWidth / 2 }],
              }}
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setBubbleWidth((prev) => (prev === width ? prev : width));
              }}
            >
              <LinearGradient
                colors={BUBBLE_BORDER_GRADIENT}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.valueBubbleBorder}
              >
                <RNView style={styles.valueBubbleInner}>
                  <RNView style={styles.valueBubbleRow}>
                    {currencySymbol}
                    <Text style={styles.valueBubbleText}>
                      {value.toLocaleString()}
                    </Text>
                  </RNView>
                </RNView>
              </LinearGradient>
            </RNView>
          ) : null}
        </RNView>

        {showTicks && trackWidth > 0 ? (
          <RNView style={styles.ticksContainer}>
            {ticks.map((tick) => {
              const tickProgress =
                max <= min ? 0 : clamp((tick - min) / (max - min), 0, 1);
              const label = formatTickValue(tick);
              const fallbackWidth = Math.max(24, label.length * 8);
              const tickWidth = tickWidths[tick] ?? fallbackWidth;
              const tickLeft = tickProgress * trackWidth - tickWidth / 2;

              return (
                <Text
                  key={tick}
                  onLayout={(event) => {
                    const width = event.nativeEvent.layout.width;
                    setTickWidths((prev) =>
                      prev[tick] === width ? prev : { ...prev, [tick]: width },
                    );
                  }}
                  style={{
                    position: "absolute",
                    width: tickWidth,
                    left: tickLeft,
                    textAlign: "center",
                    fontVariant: ["tabular-nums"],
                    fontFamily: "InstrumentSans-Regular",
                    fontSize: 12,
                    lineHeight: 16,
                    color:
                      disabled || loading
                        ? "rgba(183, 180, 176, 0.5)"
                        : colors.neutral[400],
                  }}
                >
                  {label}
                </Text>
              );
            })}
          </RNView>
        ) : null}
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  valueBubbleBorder: {
    borderRadius: 999,
    padding: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.17,
    shadowRadius: 7,
    elevation: 4,
  },
  valueBubbleInner: {
    borderRadius: 999,
    minWidth: DEFAULT_BUBBLE_WIDTH,
    backgroundColor: BUBBLE_SURFACE,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  valueBubbleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  valueBubbleText: {
    marginLeft: 4,
    fontFamily: "InstrumentSans-Regular",
    fontSize: 12,
    lineHeight: 16,
    color: "#0C0C0D",
    fontVariant: ["tabular-nums"],
  },
  ticksContainer: {
    position: "relative",
    marginTop: 16,
    minHeight: 18,
  },
});
