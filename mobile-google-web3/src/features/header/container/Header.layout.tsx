import type { ImageSource } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  PointsBadge,
  Pressable,
  StreakBadge,
  Text,
  View,
} from "@/components/ui";
import type { StreakDay } from "@/lib/format/date";
import { Avatar } from "../components/Avatar";
import { PointsPopover } from "../components/PointsPopover";
import { ProfilePopover } from "../components/ProfilePopover";
import { StreakPopover } from "../components/StreakPopover";

type HeaderLayoutProps = {
  name: string;
  email: string;
  points: number | null;
  streak: number | null;
  streakDays: StreakDay[];
  loadingStreak: boolean;
  loadingPoints: boolean;
  avatarSource: ImageSource;
  onPressProfile: () => void;
  onPressPoints: () => void;
  onPressStreak: () => void;
  profilePopoverVisible: boolean;
  pointsPopoverVisible: boolean;
  streakPopoverVisible: boolean;
  onCloseProfilePopover: () => void;
  onClosePointsPopover: () => void;
  onCloseStreakPopover: () => void;
  onPressViewProfile: () => void;
  onPressSettings: () => void;
  onPressAccountHistory?: () => void;
  onPressSignOut: () => void;
  signingOut: boolean;
  onPressPointsDetails: () => void;
  onPressPlay: () => void;
};

export function HeaderLayout({
  name,
  email,
  points,
  streak,
  streakDays,
  loadingStreak,
  loadingPoints,
  avatarSource,
  onPressProfile,
  onPressPoints,
  onPressStreak,
  profilePopoverVisible,
  pointsPopoverVisible,
  streakPopoverVisible,
  onCloseProfilePopover,
  onClosePointsPopover,
  onCloseStreakPopover,
  onPressViewProfile,
  onPressSettings,
  onPressAccountHistory,
  onPressSignOut,
  signingOut,
  onPressPointsDetails,
  onPressPlay,
}: HeaderLayoutProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-surface-tertiary"
      accessibilityRole="header"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between mx-4 py-4 border-b border-surface-secondary min-h-[60px]">
        <Pressable
          className="flex-row items-center gap-3 rounded-full px-2 py-1"
          onPress={onPressProfile}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open profile quick actions"
        >
          <Avatar source={avatarSource} size="sm" className="bg-red-500" />
          <View>
            <Text className="font-matter text-lg text-primary dark:text-white">
              {name}
            </Text>
          </View>
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onPressStreak}
            className="active:opacity-90"
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open streak details"
          >
            <StreakBadge streak={streak} loading={loadingStreak} />
          </Pressable>
          <Pressable
            onPress={onPressPoints}
            className="active:opacity-90"
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Open points details"
          >
            <PointsBadge points={points} loading={loadingPoints} />
          </Pressable>
        </View>
      </View>

      <ProfilePopover
        visible={profilePopoverVisible}
        onClose={onCloseProfilePopover}
        avatarSource={avatarSource}
        name={name}
        email={email}
        onPressSettings={onPressSettings}
        onPressViewProfile={onPressViewProfile}
        onPressAccountHistory={onPressAccountHistory}
        onPressSignOut={onPressSignOut}
        signingOut={signingOut}
      />

      <PointsPopover
        visible={pointsPopoverVisible}
        onClose={onClosePointsPopover}
        onPressPlay={onPressPlay}
        points={points}
      />

      <StreakPopover
        visible={streakPopoverVisible}
        onClose={onCloseStreakPopover}
        streak={streak}
        days={streakDays}
        loading={loadingStreak}
      />
    </View>
  );
}
