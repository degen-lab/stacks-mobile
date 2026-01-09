import type { ImageSource } from "expo-image";

import { Text, View } from "@/components/ui";
import { Avatar } from "@/features/header/components/Avatar";

export type UserCardProps = {
  id: number | string;
  nickname: string;
  joinedAt?: string;
  isActive: boolean;
  pointsEarned: number;
  imageUri?: ImageSource;
  testID?: string;
};

export default function UserCard({
  id,
  nickname,
  joinedAt,
  isActive,
  pointsEarned,
  imageUri,
  testID,
}: UserCardProps) {
  const fallbackAvatar = require("@/assets/images/splash-icon.png");
  const avatarSource = imageUri || fallbackAvatar;
  const baseTestID = testID ?? `user-card-${id}`;

  return (
    <View
      className="flex-row items-center justify-between bg-sand-100 rounded-xl px-4 py-3 border border-surface-secondary"
      testID={baseTestID}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Avatar source={avatarSource} size="sm" />
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-base font-matter text-primary"
              testID={`${baseTestID}-nickname`}
            >
              {nickname}
            </Text>
            {isActive && (
              <View
                className="bg-feedback-green rounded-full w-2 h-2"
                testID={`${baseTestID}-active`}
              />
            )}
          </View>
          {joinedAt && (
            <Text
              className="text-xs font-instrument-sans text-secondary mt-1"
              testID={`${baseTestID}-joined`}
            >
              Joined {joinedAt}
            </Text>
          )}
        </View>
      </View>

      <Text
        className="text-sm font-matter text-secondary"
        testID={`${baseTestID}-points`}
      >
        <Text className="font-instrument-sans-medium text-primary">
          +{pointsEarned}
        </Text>{" "}
        points
      </Text>
    </View>
  );
}
