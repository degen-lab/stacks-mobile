import { useCallback, useState } from "react";
import { View } from "react-native";

type ProgressProps = {
  value?: number; // 0-100
  className?: string;
  trackColor?: string;
  indicatorColor?: string;
  thumbColor?: string;
  showThumb?: boolean;
  thumbSize?: number;
};

export function Progress({
  value = 0,
  className = "",
  trackColor = "#D8D6D3",
  indicatorColor = "#F7931A",
  thumbColor,
  showThumb = true,
  thumbSize = 10,
}: ProgressProps) {
  const progress = Math.min(100, Math.max(0, value));
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbLeft = (progress / 100) * trackWidth;
  const resolvedThumbColor = thumbColor ?? indicatorColor;

  const handleTrackLayout = useCallback((event: any) => {
    const width = event?.nativeEvent?.layout?.width ?? 0;
    setTrackWidth((prev) => (prev !== width ? width : prev));
  }, []);

  return (
    <View
      className="relative w-full"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: progress }}
    >
      <View
        className={`h-1 flex-row overflow-hidden rounded-full ${className}`}
        style={{ backgroundColor: trackColor }}
        onLayout={handleTrackLayout}
      >
        <View
          className="h-full rounded-full"
          style={{
            flex: progress,
            backgroundColor: indicatorColor,
          }}
        />
        <View
          style={{
            flex: 100 - progress,
          }}
        />
      </View>

      {showThumb && trackWidth > 0 && (
        <View
          pointerEvents="none"
          className="absolute rounded-full"
          style={{
            width: thumbSize,
            height: thumbSize,
            left: thumbLeft,
            top: 2,
            transform: [
              { translateX: -thumbSize / 2 },
              { translateY: -thumbSize / 2 },
            ],
            backgroundColor: resolvedThumbColor,
          }}
        />
      )}
    </View>
  );
}
