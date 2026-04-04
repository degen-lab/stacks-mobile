import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

import { VISUAL_CONFIG, SCREEN_HEIGHT, SCREEN_WIDTH } from "../config";

export const useBridgeLayout = () => {
  const [layoutHeight, setLayoutHeight] = useState(SCREEN_HEIGHT);
  const [layoutWidth, setLayoutWidth] = useState(SCREEN_WIDTH);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height: nextHeight, width: nextWidth } = event.nativeEvent.layout;
    setLayoutHeight((prev) =>
      Math.abs(prev - nextHeight) < 1 ? prev : nextHeight,
    );
    setLayoutWidth((prev) =>
      Math.abs(prev - nextWidth) < 1 ? prev : nextWidth,
    );
  }, []);

  const canvasHeight = layoutHeight;
  const worldOffsetY = canvasHeight - VISUAL_CONFIG.CANVAS_H;
  const maxBridgeLength = Math.max(
    0,
    Math.min(VISUAL_CONFIG.MAX_BRIDGE_LENGTH, Math.floor(layoutWidth)),
  );

  return {
    canvasHeight,
    handleLayout,
    layoutHeight,
    maxBridgeLength,
    worldOffsetY,
  };
};
