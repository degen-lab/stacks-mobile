import { Button, View } from "@/components/ui";
import { LeaderboardItem } from "@/features/leaderboard/components/leaderboard-item";
import type { LeaderboardUser } from "@/features/leaderboard/types";
import { useAuth } from "@/lib/store/auth";
import type { RelativePathString } from "expo-router";
import { useRouter } from "expo-router";

export type LeaderboardListProps = {
  users?: LeaderboardUser[];
  currentUserRank?: number | null;
};

export function LeaderboardList({
  users = [],
  currentUserRank,
}: LeaderboardListProps) {
  const router = useRouter();
  const { userData } = useAuth();

  const topUsers = users.slice(0, 7);
  const filteredTopUsers = topUsers.filter(
    (user) => !(user.isCurrentUser && user.rank <= 3),
  );
  const hasMore = users.length > 7;
  const hasCurrentUser = users.some((user) => user.isCurrentUser);
  const currentUser = userData?.user;
  const isCurrentUserInPodium =
    typeof currentUserRank === "number" && currentUserRank > 0
      ? currentUserRank <= 3
      : false;

  const missingCurrentUser: LeaderboardUser | null =
    currentUser && !hasCurrentUser && !isCurrentUserInPodium
      ? {
          rank: 0,
          rankLabel: "0",
          name: currentUser.name ?? "Stacks user",
          score: 0,
          scoreLabel: "Play to submit your score!",
          photoUri: currentUser.photo ? { uri: currentUser.photo } : undefined,
          isCurrentUser: true,
        }
      : null;

  const listUsers = missingCurrentUser
    ? [missingCurrentUser, ...filteredTopUsers]
    : filteredTopUsers;

  const handleSeeMore = () => {
    router.push("/leaderboard" as RelativePathString);
  };

  const onMissingSubmission = () => {
    router.push("/stacks-bridge");
  };

  return (
    <View className="px-0">
      {listUsers.map((user, index) => {
        const isFirst = index === 0;
        const isLast = index === listUsers.length - 1;

        return (
          <LeaderboardItem
            key={`${user.rankLabel ?? user.rank}-${user.name}`}
            user={user}
            isFirst={isFirst}
            isLast={isLast}
            highlight={user.isCurrentUser}
            onMissingSubmission={
              user.isCurrentUser ? onMissingSubmission : undefined
            }
          />
        );
      })}
      {hasMore && (
        <Button variant="link" label="See more" onPress={handleSeeMore} />
      )}
    </View>
  );
}
