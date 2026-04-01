import type { ImageSource } from "expo-image";
import { Eye, EyeOff } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InfoBadge, Pressable, Text, View } from "@/components/ui";
import colors from "@/components/ui/colors";

import { StreakIcon } from "@/components/ui/icons/streak";
import { Avatar } from "../components/Avatar";
import { BreadcrumbBar } from "../components/BreadcrumbBar";
import { PointsPopover } from "../components/PointsPopover";
import { ProfilePopover } from "../components/ProfilePopover";
import { StreakPopover } from "../components/StreakPopover";

export type EarnBalanceTrigger = {
  value: number | string | null;
  loading?: boolean;
  isBalanceVisible: boolean;
  onPress: () => void;
  onToggleVisibility: () => void;
  accessibilityLabel?: string;
};

type HeaderLayoutProps = {
  name: string;
  email: string;
  points: number | null;
  streak: number | null;
  streakDays: import("@/lib/format/date").StreakDay[];
  loadingStreak: boolean;
  loadingPoints: boolean;
  earnBalanceTrigger?: EarnBalanceTrigger | null;
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
  onPressSettings: () => void;
  onPressAccountHistory?: () => void;
  onPressSignOut: () => void;
  signingOut: boolean;
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
  earnBalanceTrigger,
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
  onPressSettings,
  onPressAccountHistory,
  onPressSignOut,
  signingOut,
  onPressPlay,
}: HeaderLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const eyeIconColor = isDark ? colors.charcoal[300] : "#595754";
  return (
    <View
      className="bg-surface-tertiary"
      accessibilityRole="header"
      style={{ paddingTop: insets.top }}
    >
      <View className="mx-4 flex-row items-center justify-between gap-3 border-b border-surface-secondary py-4 min-h-[60px]">
        <Pressable
          className="min-w-0 flex-1 flex-row items-center gap-3 rounded-full px-2 py-1"
          onPress={onPressProfile}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open profile quick actions"
        >
          <Avatar source={avatarSource} size="sm" className="bg-red-500" />
          <View className="min-w-0 flex-1">
            <Text
              className="font-matter text-lg text-primary dark:text-white"
              numberOfLines={1}
            >
              {name}
            </Text>
          </View>
        </Pressable>

        <View className="shrink-0 flex-row items-center gap-2">
          {earnBalanceTrigger ? (
            <>
              <Pressable
                onPress={earnBalanceTrigger.onPress}
                className="active:opacity-90"
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={
                  earnBalanceTrigger.accessibilityLabel ??
                  "Open balance details"
                }
              >
                <InfoBadge
                  label="Balance"
                  value={earnBalanceTrigger.value}
                  loading={earnBalanceTrigger.loading}
                  labelClassName="text-secondary"
                  valueClassName="font-instrument-sans-medium text-primary"
                  containerClassName={
                    earnBalanceTrigger.isBalanceVisible
                      ? "border-feedback-green-150 bg-feedback-green-150 px-2.5"
                      : "border-surface-secondary bg-transparent px-2.5"
                  }
                />
              </Pressable>
              <Pressable
                onPress={earnBalanceTrigger.onToggleVisibility}
                className="h-9 w-9 items-center justify-center rounded-lg border-2 border-surface-secondary bg-transparent active:opacity-90"
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  earnBalanceTrigger.isBalanceVisible
                    ? "Hide balances"
                    : "Show balances"
                }
              >
                {earnBalanceTrigger.isBalanceVisible ? (
                  <EyeOff size={16} color={eyeIconColor} />
                ) : (
                  <Eye size={16} color={eyeIconColor} />
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={onPressStreak}
                className="active:opacity-90"
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Open streak details"
              >
                <InfoBadge
                  icon={<StreakIcon size={16} />}
                  label="Streak"
                  value={streak}
                  loading={loadingStreak}
                />
              </Pressable>
              <Pressable
                onPress={onPressPoints}
                className="active:opacity-90"
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Open points details"
              >
                <InfoBadge
                  label="Points"
                  value={points}
                  loading={loadingPoints}
                />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <BreadcrumbBar />

      <ProfilePopover
        visible={profilePopoverVisible}
        onClose={onCloseProfilePopover}
        avatarSource={avatarSource}
        name={name}
        email={email}
        onPressSettings={onPressSettings}
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
