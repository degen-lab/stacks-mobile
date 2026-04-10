import { View } from "@/components/ui";
import type { PodiumUser } from "@/features/leaderboard/types";
import { PodiumPlace } from "./podium-place";

export type PodiumProps = {
  users?: PodiumUser[];
  onReport?: (user: PodiumUser) => void;
};

export function Podium({ users = [], onReport }: PodiumProps) {
  const sortedUsers = [...users].sort((a, b) => a.rank - b.rank);

  const secondPlace = sortedUsers.find((u) => u.rank === 2);
  const firstPlace = sortedUsers.find((u) => u.rank === 1);
  const thirdPlace = sortedUsers.find((u) => u.rank === 3);

  const userCount = sortedUsers.length;

  if (userCount === 0) return null;

  if (userCount === 1 && firstPlace) {
    return (
      <View className="flex-row items-end justify-center px-10 pt-1">
        <View className="flex-1 max-w-[120px]">
          <PodiumPlace
            user={firstPlace}
            rank={firstPlace.rank}
            borderRadiusLeft={8}
            borderRadiusRight={8}
            showBorder={true}
            onReport={
              !firstPlace.isCurrentUser
                ? () => onReport?.(firstPlace)
                : undefined
            }
          />
        </View>
      </View>
    );
  }

  if (userCount === 2 && firstPlace && secondPlace) {
    return (
      <View className="flex-row items-end justify-center px-10 pt-1">
        <View className="flex-1" />
        <PodiumPlace
          user={firstPlace}
          rank={firstPlace.rank}
          borderRadiusLeft={8}
          borderRadiusRight={0}
          showBorder={true}
          onReport={
            !firstPlace.isCurrentUser ? () => onReport?.(firstPlace) : undefined
          }
        />
        <PodiumPlace
          user={secondPlace}
          rank={secondPlace.rank}
          borderRadiusLeft={0}
          borderRadiusRight={8}
          showBorder={false}
          onReport={
            !secondPlace.isCurrentUser
              ? () => onReport?.(secondPlace)
              : undefined
          }
        />
        <View className="flex-1" />
      </View>
    );
  }

  return (
    <View className="flex-row items-end justify-center px-10 pt-1">
      {secondPlace && (
        <PodiumPlace
          user={secondPlace}
          rank={secondPlace.rank}
          borderRadiusLeft={8}
          borderRadiusRight={0}
          showBorder={false}
          onReport={
            !secondPlace.isCurrentUser
              ? () => onReport?.(secondPlace)
              : undefined
          }
        />
      )}
      {firstPlace && (
        <PodiumPlace
          user={firstPlace}
          rank={firstPlace.rank}
          borderRadiusLeft={0}
          borderRadiusRight={0}
          showBorder={true}
          onReport={
            !firstPlace.isCurrentUser ? () => onReport?.(firstPlace) : undefined
          }
        />
      )}
      {thirdPlace && (
        <PodiumPlace
          user={thirdPlace}
          rank={thirdPlace.rank}
          borderRadiusLeft={0}
          borderRadiusRight={8}
          showBorder={false}
          onReport={
            !thirdPlace.isCurrentUser ? () => onReport?.(thirdPlace) : undefined
          }
        />
      )}
    </View>
  );
}
