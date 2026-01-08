import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { useUserProfile } from "@/api/user";
import { calculateStreakDays } from "@/lib/format/date";
import { signOut as signOutAction, useAuth } from "@/lib/store/auth";
import { HeaderLayout } from "./Header.layout";

export function Header() {
  const router = useRouter();
  const { userData } = useAuth();
  const { data: userProfile } = useUserProfile();
  const [profilePopoverVisible, setProfilePopoverVisible] = useState(false);
  const [pointsPopoverVisible, setPointsPopoverVisible] = useState(false);
  const [streakPopoverVisible, setStreakPopoverVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const avatarSource = useMemo(
    () => (userData?.user.photo ? { uri: userData.user.photo } : {}),
    [userData?.user.photo],
  );
  const headerName = userData?.user.name ?? "Stacks user";

  const email = userData?.user.email ?? "";

  const streakDays = useMemo(
    () =>
      calculateStreakDays(
        userProfile?.streak ?? 0,
        userProfile?.lastStreakCompletionDate ?? null,
      ),
    [userProfile?.streak, userProfile?.lastStreakCompletionDate],
  );

  const loadingStreak = useMemo(() => userProfile === undefined, [userProfile]);
  const loadingPoints = useMemo(() => userProfile === undefined, [userProfile]);

  const handlePressProfile = useCallback(() => {
    setPointsPopoverVisible(false);
    setStreakPopoverVisible(false);
    setProfilePopoverVisible(true);
  }, []);

  const handlePressPoints = useCallback(async () => {
    setProfilePopoverVisible(false);
    setStreakPopoverVisible(false);
    setPointsPopoverVisible(true);
  }, []);

  const handlePressStreak = useCallback(async () => {
    setProfilePopoverVisible(false);
    setPointsPopoverVisible(false);
    setStreakPopoverVisible(true);
  }, []);

  const handlePressViewProfile = useCallback(() => {
    router.push("/profile");
  }, [router]);

  const handlePressSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const handlePressPointsDetails = useCallback(() => {
    // TODO: hook into points/leaderboard navigation
  }, []);

  const handlePressPlay = useCallback(() => {
    setPointsPopoverVisible(false);
    // Navigate to Play tab - route matches the tab name in _layout.tsx
    router.push("/(app)/Play");
  }, [router]);

  const handlePressAccountHistory = useCallback(() => {
    // TODO: hook into account history / devices screen
  }, []);

  const handlePressSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutAction();
    } catch (error) {
      console.error("Sign out failed", error);
    } finally {
      setSigningOut(false);
      setProfilePopoverVisible(false);
      setPointsPopoverVisible(false);
      setStreakPopoverVisible(false);
    }
  }, [signingOut]);

  return (
    <HeaderLayout
      name={headerName}
      email={email}
      points={userProfile?.points ?? null}
      streak={userProfile?.streak ?? null}
      streakDays={streakDays}
      loadingStreak={loadingStreak}
      loadingPoints={loadingPoints}
      avatarSource={avatarSource}
      onPressProfile={handlePressProfile}
      onPressPoints={handlePressPoints}
      onPressStreak={handlePressStreak}
      profilePopoverVisible={profilePopoverVisible}
      pointsPopoverVisible={pointsPopoverVisible}
      streakPopoverVisible={streakPopoverVisible}
      onCloseProfilePopover={() => setProfilePopoverVisible(false)}
      onClosePointsPopover={() => setPointsPopoverVisible(false)}
      onCloseStreakPopover={() => setStreakPopoverVisible(false)}
      onPressViewProfile={handlePressViewProfile}
      onPressSettings={handlePressSettings}
      onPressAccountHistory={handlePressAccountHistory}
      onPressSignOut={handlePressSignOut}
      signingOut={signingOut}
      onPressPointsDetails={handlePressPointsDetails}
      onPressPlay={handlePressPlay}
    />
  );
}
