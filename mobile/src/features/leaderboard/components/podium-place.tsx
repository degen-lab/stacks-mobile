import { LinearGradient } from "expo-linear-gradient";
import type { ViewStyle } from "react-native";
import { Pressable } from "react-native";

import { Text, View } from "@/components/ui";
import { Avatar } from "@/features/header/components/Avatar";
import type { PodiumUser } from "@/features/leaderboard/types";
import { getLeaderboardDisplayName } from "@/features/leaderboard/utils";

export type PodiumPlaceProps = {
  user: PodiumUser;
  rank: number;
  borderRadiusLeft?: number;
  borderRadiusRight?: number;
  showBorder?: boolean;
  onReport?: () => void;
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
  user,
  rank,
  borderRadiusLeft = 8,
  borderRadiusRight = 8,
  showBorder = false,
  onReport,
}: PodiumPlaceProps) {
  const fallbackAvatar = require("@/assets/images/icon.png");
  const avatarSource = user.photoUri || fallbackAvatar;
  const height = getHeight(rank);
  const backgroundColor = getBackgroundColor(rank);
  const gradientColors = getGradientColors(rank);
  const isFirstPlace = rank === 1;
  const useGradient = isFirstPlace && gradientColors !== null;
  const displayName = getLeaderboardDisplayName(user.name);
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
      <View className="items-center -mb-8 z-10 w-full px-1">
        <Text
          className="mb-0.5 max-w-[96px] text-center text-sm matter text-secondary dark:text-white"
          numberOfLines={2}
        >
          {displayName}
        </Text>
        <Text className="mb-2 text-sm font-instrument-sans text-secondary dark:text-white">
          {user.score.toLocaleString()}
        </Text>
        <Pressable
          onPress={onReport}
          disabled={!onReport}
          hitSlop={8}
          style={({ pressed }) => ({
            opacity: pressed && onReport ? 0.7 : 1,
          })}
        >
          <View
            className={
              showBorder ? "border-[3px] border-white rounded-full" : ""
            }
          >
            <Avatar source={avatarSource} size="lg" />
          </View>
        </Pressable>
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
