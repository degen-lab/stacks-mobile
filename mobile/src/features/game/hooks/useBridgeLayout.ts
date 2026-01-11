import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

import { VISUAL_CONFIG, SCREEN_HEIGHT } from "../config";

export const useBridgeLayout = () => {
  const [layoutHeight, setLayoutHeight] = useState(SCREEN_HEIGHT);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setLayoutHeight((prev) =>
      Math.abs(prev - nextHeight) < 1 ? prev : nextHeight,
    );
  }, []);

  const canvasHeight = layoutHeight;
  const worldOffsetY = canvasHeight - VISUAL_CONFIG.CANVAS_H;

  return { canvasHeight, handleLayout, layoutHeight, worldOffsetY };
};
