import { usePathname, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { useUserProfile } from "@/api/user";
import { formatUsd } from "@/lib/format/currency";
import { usePortfolioBalance } from "@/hooks/use-portfolio-balance";
import { calculateStreakDays } from "@/lib/format/date";
import { maskDisplayValue } from "@/lib/format/mask-display-value";
import { useBalanceVisibility } from "@/lib/store/balance-visibility";
import { signOut as signOutAction, useAuth } from "@/lib/store/auth";
import { buildEarnAssetRoute } from "@/features/earn/lib/asset-route";
import { EarnBalancePopover } from "../components/EarnBalancePopover";
import { HeaderLayout } from "./Header.layout";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { userData } = useAuth();
  const { data: userProfile, isLoading: isUserProfileLoading } =
    useUserProfile();
  const [profilePopoverVisible, setProfilePopoverVisible] = useState(false);
  const [pointsPopoverVisible, setPointsPopoverVisible] = useState(false);
  const [streakPopoverVisible, setStreakPopoverVisible] = useState(false);
  const [balancePopoverVisible, setBalancePopoverVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { isBalanceVisible, toggleBalanceVisibility } = useBalanceVisibility();
  const portfolio = usePortfolioBalance();

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

  const assets = portfolio.assets;

  const handlePressSettings = useCallback(() => {
    setProfilePopoverVisible(false);
    router.push("/settings");
  }, [router]);

  const handlePressAccountHistory = useCallback(() => {
    setProfilePopoverVisible(false);
    router.push("/settings/accounts");
  }, [router]);

  const handlePressPlay = useCallback(() => {
    setPointsPopoverVisible(false);
    router.push("/Play");
  }, [router]);

  const handlePressAsset = useCallback(
    (asset: (typeof assets)[number]) => {
      setBalancePopoverVisible(false);
      router.push(buildEarnAssetRoute(asset));
    },
    [router],
  );

  const earnBalanceTrigger = useMemo(() => {
    if (!isEarnScreen) return null;

    const formattedBalance = formatUsd(portfolio.usdBalanceOrNull, {
      compact: true,
    });

    return {
      value: isBalanceVisible
        ? formattedBalance
        : maskDisplayValue(formattedBalance),
      loading: portfolio.isLoading,
      isBalanceVisible,
      onPress: () => setBalancePopoverVisible(true),
      onToggleVisibility: () => {
        void toggleBalanceVisibility();
      },
      accessibilityLabel: "Open balance details",
    };
  }, [
    isBalanceVisible,
    isEarnScreen,
    portfolio.isLoading,
    portfolio.usdBalanceOrNull,
    toggleBalanceVisibility,
  ]);

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
        name={userData?.user.name ?? "Stacks user"}
        email={userData?.user.email ?? ""}
        points={userProfile?.points ?? null}
        streak={userProfile?.streak ?? null}
        streakDays={streakDays}
        loadingStreak={isUserProfileLoading}
        loadingPoints={isUserProfileLoading}
        earnBalanceTrigger={earnBalanceTrigger}
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
        onPressSettings={handlePressSettings}
        onPressAccountHistory={handlePressAccountHistory}
        onPressSignOut={handlePressSignOut}
        signingOut={signingOut}
        onPressPlay={handlePressPlay}
      />
      <EarnBalancePopover
        visible={balancePopoverVisible}
        onClose={() => setBalancePopoverVisible(false)}
        totalBalanceUsd={portfolio.usdBalanceOrNull}
        assets={assets}
        loading={portfolio.isLoading}
        isBalanceVisible={isBalanceVisible}
        onPressAsset={handlePressAsset}
      />
    </>
  );
}
