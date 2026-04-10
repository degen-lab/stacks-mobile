import type { ImageSource } from "expo-image";

import { Pressable, Text, View, colors } from "@/components/ui";
import { TrophyIcon } from "@/components/ui/icons/trophy-icon";
import { Avatar } from "@/features/header/components/Avatar";
import type { LeaderboardUser } from "@/features/leaderboard/types";
import { getLeaderboardDisplayName } from "@/features/leaderboard/utils";

export type LeaderboardItemProps = {
  user: LeaderboardUser;
  isFirst?: boolean;
  onMissingSubmission?: () => void;
  onReport?: () => void;
  isLast?: boolean;
  avatarFallback?: ImageSource;
  highlight?: boolean;
};

export function LeaderboardItem({
  user,
  isFirst = false,
  isLast = false,
  onMissingSubmission,
  onReport,
  avatarFallback,
  highlight = false,
}: LeaderboardItemProps) {
  const fallbackAvatar = avatarFallback ?? require("@/assets/images/icon.png");
  const medalColor =
    user.tier === "Gold"
      ? colors.primary[600]
      : user.tier === "Silver"
        ? colors.neutral[400]
        : user.tier === "Bronze"
          ? "#B06A3B"
          : null;
  const displayName = getLeaderboardDisplayName(user.name);

  const pressHandler = user.isCurrentUser ? onMissingSubmission : onReport;

  return (
    <Pressable onPress={pressHandler} disabled={!pressHandler}>
      <View
        className={`flex-row items-center bg-sand-100 dark:bg-surface-primary border border-border-secondary p-4 ${
          isFirst ? "rounded-t-xl" : ""
        } ${isLast ? "rounded-b-xl" : ""} ${!isLast ? "border-b-0" : ""}`}
      >
        <View className="w-10 flex-row items-center gap-1">
          <Text className="text-sm font-instrument-sans-semibold text-secondary">
            #{user.rankLabel ?? user.rank}
          </Text>
        </View>
        <Avatar source={user.photoUri || fallbackAvatar} size="xs" />
        <View className="ml-2 min-w-0 flex-1 flex-row items-center gap-1">
          <Text
            className="min-w-0 shrink text-sm font-instrument-sans text-secondary"
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {medalColor ? <TrophyIcon size={14} color={medalColor} /> : null}
        </View>
        <Text className="text-sm font-instrument-sans text-primary">
          {user.scoreLabel ?? user.score.toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}
