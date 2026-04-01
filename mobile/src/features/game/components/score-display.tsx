import { Animated } from "react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/ui";
import { memo } from "react";
import { VISUAL_CONFIG } from "../config";
import type { BridgeOverlayState } from "../types";

type ScoreDisplayProps = {
  overlayState: BridgeOverlayState;
  score: number;
};

const ScoreDisplay = ({ overlayState, score }: ScoreDisplayProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  if (overlayState !== "PLAYING") return null;

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center px-4"
      style={{ top: insets.top + 32, paddingTop: 32 }}
    >
      <Text
        className="text-5xl font-dm-sans-extralight font-extralight text-primary"
        style={{
          paddingTop: 2,
          ...(isDark
            ? {
                color: VISUAL_CONFIG.DARK_SCENE.HUD_SCORE,
                textShadowColor: "rgba(0, 0, 0, 0.35)",
                textShadowRadius: 10,
              }
            : null),
        }}
      >
        {score}
      </Text>
      <Animated.Text
        className="mt-3 mx-4 text-center text-3xl font-dm-sans-extralight font-extralight text-secondary"
        style={{
          maxWidth: 340,
          ...(isDark
            ? {
                color: VISUAL_CONFIG.DARK_SCENE.HUD_HELPER,
                textShadowColor: "rgba(0, 0, 0, 0.25)",
                textShadowRadius: 8,
              }
            : null),
        }}
      >
        Hold finger on screen to build stacks bridge
      </Animated.Text>
    </View>
  );
};

export default memo(ScoreDisplay);
