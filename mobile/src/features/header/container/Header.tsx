import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { useUserProfile } from "@/api/user";
import { useBtcBalance } from "@/hooks/use-btc-balance";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { calculateStreakDays } from "@/lib/format/date";
import { signOut as signOutAction, useAuth } from "@/lib/store/auth";
import { useActiveAccountIndex } from "@/lib/store/settings";
import { HeaderLayout } from "./Header.layout";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { userData } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { activeAccountIndex } = useActiveAccountIndex();
  const [profilePopoverVisible, setProfilePopoverVisible] = useState(false);
  const [pointsPopoverVisible, setPointsPopoverVisible] = useState(false);
  const [streakPopoverVisible, setStreakPopoverVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { balance: btcBalance, isLoading: loadingBtc } = useBtcBalance();
  const { balance: stxBalance, isLoading: loadingStx } =
    useStxBalance(activeAccountIndex);

  const isEarnScreen =
    pathname.startsWith("/(app)/Earn") || pathname.startsWith("/Earn");

  const avatarSource = useMemo(
    () => (userData?.user.photo ? { uri: userData.user.photo } : {}),
    [userData?.user.photo],
  );

  const streakDays = useMemo(
    () =>
      calculateStreakDays(
        userProfile?.streak ?? 0,
        userProfile?.lastStreakCompletionDate,
      ),
    [userProfile?.streak, userProfile?.lastStreakCompletionDate],
  );

  const handlePressViewProfile = useCallback(() => {
    setProfilePopoverVisible(false);
    router.push("/profile");
  }, [router]);

  const handlePressSettings = useCallback(() => {
    setProfilePopoverVisible(false);
    router.push("/settings");
  }, [router]);

  const handlePressAccountHistory = useCallback(() => {
    setProfilePopoverVisible(false);
    router.push("/settings/accounts");
  }, [router]);

  const handlePressPointsDetails = useCallback(() => {
    setPointsPopoverVisible(false);
    router.push("/leaderboard");
  }, [router]);

  const handlePressPlay = useCallback(() => {
    setPointsPopoverVisible(false);
    router.push("/Play");
  }, [router]);

  const handlePressSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutAction();
      router.replace("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setSigningOut(false);
    }
  }, [router, signingOut]);

  return (
    <HeaderLayout
      name={userData?.user.name ?? "Stacks user"}
      email={userData?.user.email ?? ""}
      points={userProfile?.points ?? null}
      streak={userProfile?.streak ?? null}
      streakDays={streakDays}
      loadingStreak={!userProfile}
      loadingPoints={!userProfile}
      btcBalance={btcBalance}
      stxBalance={stxBalance}
      loadingBtc={loadingBtc}
      loadingStx={loadingStx}
      isEarnScreen={isEarnScreen}
      avatarSource={avatarSource}
      onPressProfile={() => setProfilePopoverVisible(true)}
      onPressPoints={() => setPointsPopoverVisible(true)}
      onPressStreak={() => setStreakPopoverVisible(true)}
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
      onPressPlay={handlePressPlay}
    />
  );
}
