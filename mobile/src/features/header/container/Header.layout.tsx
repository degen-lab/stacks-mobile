import type { ImageSource } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InfoBadge, Pressable, Text, View } from "@/components/ui";
import { BtcLogo } from "@/components/ui/icons/btc-logo";
import { StreakIcon } from "@/components/ui/icons/streak";
import { StxCoin } from "@/components/ui/icons/stx-coin";
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
  btcBalance: number;
  stxBalance: number;
  loadingBtc: boolean;
  loadingStx: boolean;
  isEarnScreen: boolean;
  breadcrumb: {
    parent: string;
    current: string;
    parentPath: string;
    helpIcon?: React.ReactNode;
    onHelpPress?: () => void;
  } | null;
  breadcrumbRightAccessory?: React.ReactNode;
  onBreadcrumbPress: () => void;
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
  btcBalance,
  stxBalance,
  loadingBtc,
  loadingStx,
  isEarnScreen,
  breadcrumb,
  breadcrumbRightAccessory,
  onBreadcrumbPress,
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
  const formattedBtcBalance = Number.isFinite(btcBalance)
    ? btcBalance.toFixed(8)
    : "0.00000000";

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
          {isEarnScreen ? (
            <>
              <InfoBadge
                icon={<BtcLogo size={18} />}
                label="BTC"
                value={formattedBtcBalance}
                loading={loadingBtc}
              />
              <InfoBadge
                icon={<StxCoin size={18} />}
                label="STX"
                value={stxBalance}
                loading={loadingStx}
              />
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

      {breadcrumb && (
        <View className="mx-4 flex-row items-center justify-between gap-3 border-b border-surface-secondary py-2">
          <Pressable
            onPress={onBreadcrumbPress}
            className="flex-1"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Go back to ${breadcrumb.parent}`}
          >
            <View className="flex-row items-center gap-1.5">
              <Text className="font-matter text-sm text-secondary">
                {breadcrumb.parent}
              </Text>
              <Text className="font-matter text-sm text-secondary">{">"}</Text>
              <Text className="font-matter text-sm text-primary font-medium">
                {breadcrumb.current}
              </Text>
            </View>
          </Pressable>

          {(breadcrumb.onHelpPress || breadcrumbRightAccessory) && (
            <View className="flex-row items-center gap-1">
              {breadcrumb.onHelpPress && (
                <Pressable
                  onPress={breadcrumb.onHelpPress}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Help"
                >
                  <View className="w-8 h-8 items-center justify-center">
                    {breadcrumb.helpIcon}
                  </View>
                </Pressable>
              )}
              {breadcrumbRightAccessory}
            </View>
          )}
        </View>
      )}

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
