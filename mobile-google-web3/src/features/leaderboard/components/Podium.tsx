import { View } from "@/components/ui";
import type { PodiumUser } from "@/features/leaderboard/types";
import { PodiumPlace } from "./PodiumPlace";

export type PodiumProps = {
  users?: PodiumUser[];
};

export function Podium({ users = [] }: PodiumProps) {
  const sortedUsers = [...users].sort((a, b) => a.rank - b.rank);

  // Arrange podium: 3rd place (left), 1st place (center), 2nd place (right)
  const secondPlace = sortedUsers.find((u) => u.rank === 2);
  const firstPlace = sortedUsers.find((u) => u.rank === 1);
  const thirdPlace = sortedUsers.find((u) => u.rank === 3);

  const userCount = sortedUsers.length;

  // Handle empty state
  if (userCount === 0) {
    return null;
  }

  // Handle single user - center it
  if (userCount === 1 && firstPlace) {
    return (
      <View className="flex-row items-end justify-center px-10 pt-1">
        <View className="flex-1 max-w-[120px]">
          <PodiumPlace
            rank={firstPlace.rank}
            name={firstPlace.name}
            score={firstPlace.score}
            photoUri={firstPlace.photoUri}
            borderRadiusLeft={8}
            borderRadiusRight={8}
            showBorder={true}
          />
        </View>
      </View>
    );
  }

  // Handle two users - show 1st (center) and 2nd (right), with spacer on left
  if (userCount === 2 && firstPlace && secondPlace) {
    return (
      <View className="flex-row items-end justify-center px-10 pt-1">
        <View className="flex-1" />
        <PodiumPlace
          rank={firstPlace.rank}
          name={firstPlace.name}
          score={firstPlace.score}
          photoUri={firstPlace.photoUri}
          borderRadiusLeft={8}
          borderRadiusRight={0}
          showBorder={true}
        />
        <PodiumPlace
          rank={secondPlace.rank}
          name={secondPlace.name}
          score={secondPlace.score}
          photoUri={secondPlace.photoUri}
          borderRadiusLeft={0}
          borderRadiusRight={8}
          showBorder={false}
        />
        <View className="flex-1" />
      </View>
    );
  }

  return (
    <View className="flex-row items-end justify-center px-10 pt-1">
      {secondPlace && (
        <PodiumPlace
          rank={secondPlace.rank}
          name={secondPlace.name}
          score={secondPlace.score}
          photoUri={secondPlace.photoUri}
          borderRadiusLeft={8}
          borderRadiusRight={0}
          showBorder={false}
        />
      )}
      {firstPlace && (
        <PodiumPlace
          rank={firstPlace.rank}
          name={firstPlace.name}
          score={firstPlace.score}
          photoUri={firstPlace.photoUri}
          borderRadiusLeft={0}
          borderRadiusRight={0}
          showBorder={true}
        />
      )}
      {thirdPlace && (
        <PodiumPlace
          rank={thirdPlace.rank}
          name={thirdPlace.name}
          score={thirdPlace.score}
          photoUri={thirdPlace.photoUri}
          borderRadiusLeft={0}
          borderRadiusRight={8}
          showBorder={false}
        />
      )}
    </View>
  );
}
