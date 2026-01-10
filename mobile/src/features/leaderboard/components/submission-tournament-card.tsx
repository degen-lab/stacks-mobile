import type { ImageSource } from "expo-image";

import { Text, View } from "@/components/ui";
import type { LeaderboardUser, PodiumUser } from "@/features/leaderboard/types";
import { LeaderboardItem } from "./leaderboard-item";

export type WeeklyTournamentPreviewProps = {
  podiumUsers?: PodiumUser[];
  projectedUser?: LeaderboardUser;
  title?: string;
  avatarFallback?: ImageSource;
};

export function WeeklyTournamentPreview({
  projectedUser,
  avatarFallback,
}: WeeklyTournamentPreviewProps) {
  return (
    <View>
      <View className="mt-5">
        <Text className="mb-2 text-sm font-instrument-sans text-secondary dark:text-neutral-300">
          Get your position on the leaderboard!
        </Text>
        {projectedUser ? (
          <LeaderboardItem
            user={projectedUser}
            isFirst
            isLast
            highlight
            avatarFallback={avatarFallback}
          />
        ) : null}
      </View>
    </View>
  );
}
