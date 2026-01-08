import React, { useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

type StarVariant = "left" | "right";

type AnimatedStarSplashProps = {
  variant?: StarVariant;
  style?: StyleProp<ViewStyle>;
  size?: number;
  delay?: number;
};

export default function AnimatedStarSplash({
  variant = "left",
  style,
  size = 1,
  delay = 0,
}: AnimatedStarSplashProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(variant === "left" ? -15 : 15);

  useEffect(() => {
    // 1. Solid Entrance (Pop in like a game item)
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));

    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1.1, { damping: 10, stiffness: 100 }),
        // Then settle into the breathing loop
        withDelay(
          100,
          withRepeat(
            withSequence(
              // Breathe Out (Slow expand)
              withTiming(1.1, {
                duration: 1500,
                easing: Easing.inOut(Easing.sin),
              }),
              // Breathe In (Slow contract)
              withTiming(1.0, {
                duration: 1500,
                easing: Easing.inOut(Easing.sin),
              }),
            ),
            -1, // Infinite loop
            true,
          ),
        ),
      ),
    );

    // 2. Floating Rotation (The "Levitation" effect)
    // This makes it look like it's hovering, waiting to be clicked.
    const baseRotation = variant === "left" ? -6 : 6;
    rotation.value = baseRotation;

    rotation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(baseRotation + 8, {
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(baseRotation - 8, {
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, opacity, rotation, scale, variant]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value * size },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ position: "absolute" }, style, animatedStyle]}>
      {variant === "left" ? <LeftStarSvg /> : <RightStarSvg />}
    </Animated.View>
  );
}

// === SVGs ==========================

const LeftStarSvg = React.memo(function LeftStarSvg() {
  return (
    <Svg width={24} height={23} viewBox="0 0 24 23" fill="none">
      <Defs>
        <LinearGradient
          id="starLeftGradient"
          x1="8.74798"
          y1="43.6817"
          x2="21.7908"
          y2="79.3957"
          gradientUnits="userSpaceOnUse"
        >
          {/* Brighter, sharper colors for a "gem" look */}
          <Stop offset="0" stopColor="#FFAD5A" />
          <Stop offset="1" stopColor="#FFF" />
        </LinearGradient>
      </Defs>
      <Path
        d="M15.4565 22.4733C14.5225 22.7919 13.4996 22.2957 13.1718 21.3649L12.0881 18.2883C11.1618 15.6584 8.27163 14.2562 5.63267 15.1565L2.35711 16.274C1.43476 16.5887 0.424588 16.0986 0.100829 15.1794C-0.222929 14.2602 0.262328 13.26 1.18468 12.9453L4.46024 11.8278C7.09919 10.9275 8.48757 8.06565 7.56126 5.43571L6.47763 2.35911C6.14979 1.42832 6.64117 0.415469 7.57514 0.0968305C8.50911 -0.221807 9.53201 0.274435 9.85985 1.20522L10.9435 4.28182C11.8698 6.91176 14.76 8.3139 17.399 7.41358L20.6745 6.29608C21.5969 5.98141 22.607 6.47148 22.9308 7.39068C23.2546 8.30988 22.7693 9.31014 21.8469 9.62481L18.5714 10.7423C15.9324 11.6426 14.5441 14.5045 15.4704 17.1344L16.554 20.211C16.8818 21.1418 16.3905 22.1546 15.4565 22.4733Z"
        fill="url(#starLeftGradient)"
      />
    </Svg>
  );
});

const RightStarSvg = React.memo(function RightStarSvg() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Defs>
        <LinearGradient
          id="starRightGradient"
          x1="13.138"
          y1="0.145911"
          x2="0.32686"
          y2="27.9003"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0" stopColor="#FF7A45" />
          <Stop offset="1" stopColor="#FFF" />
        </LinearGradient>
      </Defs>
      <Path
        d="M4.55396 17.1898C3.84256 16.8428 3.55449 15.9883 3.91054 15.2814L5.12845 12.8632C6.11757 10.8993 5.31729 8.52563 3.34097 7.5615L0.788568 6.31633C0.084003 5.97262 -0.2013 5.1264 0.151326 4.42625C0.503951 3.7261 1.36097 3.43716 2.06554 3.78087L4.61794 5.02604C6.59426 5.99017 8.99822 5.17967 9.98734 3.21574L11.2053 0.797546C11.5613 0.0906087 12.4266 -0.201139 13.138 0.14591C13.8494 0.492959 14.1375 1.34738 13.7815 2.05432L12.5635 4.47251C11.5744 6.43644 12.3747 8.8101 14.351 9.77423L16.9034 11.0194C17.608 11.3631 17.8933 12.2093 17.5407 12.9095C17.188 13.6096 16.331 13.8986 15.6265 13.5549L13.074 12.3097C11.0977 11.3456 8.69377 12.1561 7.70465 14.12L6.48674 16.5382C6.13069 17.2451 5.26536 17.5369 4.55396 17.1898Z"
        fill="url(#starRightGradient)"
      />
    </Svg>
  );
});
