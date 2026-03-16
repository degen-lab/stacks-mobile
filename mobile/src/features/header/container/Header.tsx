import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { HelpCircle } from "lucide-react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { useUserProfile } from "@/api/user";
import { useBtcBalance } from "@/hooks/use-btc-balance";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { calculateStreakDays } from "@/lib/format/date";
import { signOut as signOutAction, useAuth } from "@/lib/store/auth";
import { useActiveAccountIndex } from "@/lib/store/settings";
import { colors, useModal } from "@/components/ui";
import ConnectWallet from "@/features/dual-stacking/components/wallet/wallet-connected";
import { StackingGuideModal } from "@/features/stacking/components/stacking-guide-modal";
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

  // Help modal for stacking guide
  const { ref: stackingHelpModalRef, present: presentStackingHelp } =
    useModal();

  // Balance hooks
  const { balance: btcBalance, isLoading: loadingBtc } = useBtcBalance();
  const { balance: stxBalance, isLoading: loadingStx } =
    useStxBalance(activeAccountIndex);

  // Check if we're on the Earn screen
  const isEarnScreen =
    pathname.startsWith("/(app)/Earn") || pathname.startsWith("/Earn");
  const isDualStackingScreen =
    pathname.includes("/Earn/dual-stacking") ||
    pathname.includes("/(app)/Earn/dual-stacking");

  // Breadcrumb navigation for nested Earn routes
  const breadcrumb = useMemo(() => {
    if (pathname.includes("/Earn/stacking")) {
      return {
        parent: "Earn",
        current: "Stack STX",
        parentPath: "/Earn",
        helpIcon: <HelpCircle size={14} color={colors.secondary} />,
        onHelpPress: presentStackingHelp,
      };
    }
    if (pathname.includes("/Earn/dual-stacking")) {
      return {
        parent: "Earn",
        current: "Dual Stacking",
        parentPath: "/Earn",
      };
    }
    return null;
  }, [pathname, presentStackingHelp]);

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
        userProfile?.lastStreakCompletionDate,
      ),
    [userProfile?.streak, userProfile?.lastStreakCompletionDate],
  );

  const loadingStreak = !userProfile;
  const loadingPoints = !userProfile;

  const handlePressProfile = useCallback(() => {
    setProfilePopoverVisible(true);
  }, []);

  const handlePressPoints = useCallback(() => {
    setPointsPopoverVisible(true);
  }, []);

  const handlePressStreak = useCallback(() => {
    setStreakPopoverVisible(true);
  }, []);

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
    <>
      <HeaderLayout
        name={headerName}
        email={email}
        points={userProfile?.points ?? null}
        streak={userProfile?.streak ?? null}
        streakDays={streakDays}
        loadingStreak={loadingStreak}
        loadingPoints={loadingPoints}
        btcBalance={btcBalance}
        stxBalance={stxBalance}
        loadingBtc={loadingBtc}
        loadingStx={loadingStx}
        isEarnScreen={isEarnScreen}
        breadcrumb={breadcrumb}
        breadcrumbRightAccessory={
          isDualStackingScreen ? <ConnectWallet /> : null
        }
        onBreadcrumbPress={() =>
          breadcrumb && router.push(breadcrumb.parentPath as any)
        }
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

      <StackingGuideModal
        modalRef={stackingHelpModalRef as React.RefObject<BottomSheetModal>}
      />
    </>
  );
}
