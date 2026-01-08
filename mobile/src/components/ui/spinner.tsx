import { Animated, Easing } from "react-native";
import React from "react";

type SpinnerProps = {
  color: string;
  size?: number;
  trackColor?: string;
  strokeWidth?: number;
};

export const Spinner = ({
  color,
  size = 64,
  trackColor,
  strokeWidth = 4,
}: SpinnerProps) => {
  const rotation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: trackColor ?? "transparent",
        borderTopColor: color,
        transform: [{ rotate: spin }],
      }}
    />
  );
};
