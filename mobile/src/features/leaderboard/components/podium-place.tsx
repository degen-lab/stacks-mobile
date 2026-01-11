import type { ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ViewStyle } from "react-native";

import { Text, View } from "@/components/ui";
import { Avatar } from "@/features/header/components/Avatar";

export type PodiumPlaceProps = {
  rank: number;
  name: string;
  score: number;
  photoUri?: ImageSource;
  borderRadiusLeft?: number;
  borderRadiusRight?: number;
  showBorder?: boolean;
};

const getHeight = (rank: number): number => {
  switch (rank) {
    case 1:
      return 120;
    case 2:
      return 100;
    case 3:
      return 80;
    default:
      return 120;
  }
};

const getBackgroundColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return "#FF6B4A";
    case 2:
      return "#C4C4C4";
    case 3:
      return "#4A4A4A";
    default:
      return "#C4C4C4";
  }
};

const getGradientColors = (
  rank: number,
): [string, string, ...string[]] | null => {
  if (rank === 1) {
    return ["#FC7A4F", "#FF9835"];
  }
  return null;
};

export function PodiumPlace({
  rank,
  name,
  score,
  photoUri,
  borderRadiusLeft = 8,
  borderRadiusRight = 8,
  showBorder = false,
}: PodiumPlaceProps) {
  const fallbackAvatar = require("@/assets/images/splash-icon.png");
  const avatarSource = photoUri || fallbackAvatar;
  const height = getHeight(rank);
  const backgroundColor = getBackgroundColor(rank);
  const gradientColors = getGradientColors(rank);
  const isFirstPlace = rank === 1;
  const useGradient = isFirstPlace && gradientColors !== null;
  const borderWidth = 2;
  const borderColors: [string, string] = ["#F7F6F5", "#FF9835"];
  const borderLocations: [number, number] = [0.37, 1];
  const topLeftRadius = isFirstPlace ? 8 : borderRadiusLeft;
  const topRightRadius = isFirstPlace ? 8 : borderRadiusRight;
  const bottomLeftRadius = isFirstPlace ? 0 : borderRadiusLeft;
  const bottomRightRadius = isFirstPlace ? 0 : borderRadiusRight;

  const blockStyle: ViewStyle = {
    height,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: topLeftRadius,
    borderTopRightRadius: topRightRadius,
    borderBottomLeftRadius: bottomLeftRadius,
    borderBottomRightRadius: bottomRightRadius,
  };

  const borderStyle: ViewStyle = {
    ...blockStyle,
    padding: borderWidth,
  };

  const innerBlockStyle: ViewStyle = {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: Math.max(0, topLeftRadius - borderWidth),
    borderTopRightRadius: Math.max(0, topRightRadius - borderWidth),
    borderBottomLeftRadius: Math.max(0, bottomLeftRadius - borderWidth),
    borderBottomRightRadius: Math.max(0, bottomRightRadius - borderWidth),
  };

  return (
    <View className="items-center flex-1">
      <View className="items-center -mb-8 z-10">
        <Text className="text-sm matter mb-0.5 text-secondary dark:text-white">
          {name}
        </Text>
        <Text className="text-sm font-instrument-sans mb-2 text-secondary dark:text-white">
          {score.toLocaleString()}
        </Text>
        <View
          className={showBorder ? "border-[3px] border-white rounded-full" : ""}
        >
          <Avatar source={avatarSource} size="lg" />
        </View>
      </View>
      {useGradient && gradientColors ? (
        <LinearGradient
          colors={borderColors}
          locations={borderLocations}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.0, y: 0.5 }}
          style={borderStyle}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={innerBlockStyle}
          >
            <Text className="text-3xl mt-4  font-matter text-white">
              {rank}
            </Text>
          </LinearGradient>
        </LinearGradient>
      ) : (
        <View style={{ ...blockStyle, backgroundColor }}>
          <Text className="text-3xl mt-4 font-matter text-white">{rank}</Text>
        </View>
      )}
    </View>
  );
}
