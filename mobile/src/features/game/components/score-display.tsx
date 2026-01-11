import { Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, View } from "@/components/ui";
import { useGameStore } from "@/lib/store/game";
import { memo } from "react";

const ScoreDisplay = () => {
  const insets = useSafeAreaInsets();
  const overlayState = useGameStore((state) => state.overlayState);
  const score = useGameStore((state) => state.score);

  if (overlayState !== "PLAYING") return null;

  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center px-4"
      style={{ top: insets.top + 32, paddingTop: 32 }}
    >
      <Text
        className="text-5xl font-dm-sans-extralight font-extralight text-primary"
        style={{ paddingTop: 2 }}
      >
        {score}
      </Text>
      <Animated.Text className="mt-3 mx-4 text-center text-3xl font-dm-sans-extralight font-extralight text-secondary">
        Hold finger on screen to build stacks bridge
      </Animated.Text>
    </View>
  );
};

export default memo(ScoreDisplay);
