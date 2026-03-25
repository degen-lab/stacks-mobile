import {
  ArrowUpRight,
  ChevronDown,
  Edit3,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react-native";
import { router } from "expo-router";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable } from "react-native";

import { Text, View, colors } from "@/components/ui";
import { useAuth } from "@/lib/store/auth";
import { truncateAddress } from "@/lib/stacks/addresses";
import { getExplorerUrl } from "@/lib/stacks/network";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useEnrollmentStatus } from "@/features/dual-stacking/hooks/use-enrollment-status";
import { useWalletActions } from "@/features/dual-stacking/hooks/use-wallet-actions";
import { ChangeRewardAddressSheet } from "@/features/dual-stacking/components/layout/modals/change-reward-address-sheet";
import { TransactionStatusSheet } from "@/features/dual-stacking/components/layout/modals/transaction-status-sheet";
import { UnenrollSheet } from "@/features/dual-stacking/components/layout/modals/unenroll-sheet";

import { WalletActionSheet, type WalletAction } from "./wallet-action-sheet";

export type ConnectedWalletVariant = "default" | "dual-stacking";

type ConnectedWalletProps = {
  variant?: ConnectedWalletVariant;
};

type WalletTriggerProps = {
  variant: ConnectedWalletVariant;
  buttonLabel: string;
  isConnected: boolean;
  isLoading: boolean;
  onPress: () => void;
};

function useWalletButtonState() {
  const { isAuthenticated } = useAuth();
  const { stxAddress, btcAddress, isLoading } = useWalletAddresses();

  const isConnected = isAuthenticated && Boolean(stxAddress);
  const buttonLabel = isLoading
    ? "Loading..."
    : isConnected && stxAddress
      ? truncateAddress(stxAddress)
      : "Connect";

  return {
    stxAddress,
    btcAddress,
    isConnected,
    isLoading,
    buttonLabel,
  };
}

function useDefaultWalletActions(
  stxAddress: string | null,
  onAfterAction: () => void,
) {
  const openInExplorer = useCallback(async () => {
    if (!stxAddress) return;

    await openBrowserAsync(getExplorerUrl(stxAddress).explorerUrl, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  }, [stxAddress]);

  return useMemo(
    () =>
      [
        {
          label: "Open in Explorer",
          icon: ArrowUpRight,
          onPress: () => {
            onAfterAction();
            void openInExplorer();
          },
        },
        {
          label: "Switch account",
          icon: UserRound,
          onPress: () => {
            onAfterAction();
            router.push("/settings/accounts");
          },
        },
      ] satisfies WalletAction[],
    [onAfterAction, openInExplorer],
  );
}

function WalletTrigger({
  variant,
  buttonLabel,
  isConnected,
  isLoading,
  onPress,
}: WalletTriggerProps) {
  const isDefaultConnectedIcon = isConnected && variant === "default";

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className={
        isDefaultConnectedIcon
          ? "h-9 w-9 items-center justify-center rounded-lg border-2 border-surface-secondary bg-transparent active:opacity-90"
          : "flex-row items-center gap-1 rounded-lg border-2 border-surface-secondary bg-neutral-100 px-3 py-1.5 active:opacity-80"
      }
      accessibilityRole="button"
      accessibilityLabel={
        isConnected ? "Open connected wallet actions" : "Connect wallet"
      }
    >
      {isDefaultConnectedIcon ? (
        <View pointerEvents="none">
          <Wallet size={14} color={colors.neutral[700]} />
        </View>
      ) : (
        <>
          <Text className="font-instrument-sans text-xs font-semibold text-primary">
            {buttonLabel}
          </Text>
          {isConnected ? (
            <View pointerEvents="none">
              <ChevronDown size={14} color={colors.neutral[700]} />
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

function DefaultConnectedWallet() {
  const { stxAddress, btcAddress, isConnected, isLoading, buttonLabel } =
    useWalletButtonState();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const actions = useDefaultWalletActions(stxAddress, () =>
    setIsActionSheetOpen(false),
  );

  const handlePrimaryPress = useCallback(() => {
    if (!isConnected) {
      router.push("/login");
      return;
    }

    setIsActionSheetOpen(true);
  }, [isConnected]);

  return (
    <>
      <WalletTrigger
        variant="default"
        buttonLabel={buttonLabel}
        isConnected={isConnected}
        isLoading={isLoading}
        onPress={handlePrimaryPress}
      />

      <WalletActionSheet
        open={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        address={stxAddress}
        btcAddress={btcAddress}
        actions={actions}
      />
    </>
  );
}

function DualStackingConnectedWallet() {
  const { stxAddress, btcAddress, isConnected, isLoading, buttonLabel } =
    useWalletButtonState();
  const { enrolledNextCycle } = useEnrollmentStatus();
  const {
    openInExplorer,
    optOut,
    optOutSponsored,
    changeRewardAddress,
    changeRewardAddressSponsored,
    isOptOutSubmitting,
    optOutStatus,
    optOutFunding,
    isChangeAddressSubmitting,
    changeAddressStatus,
    changeAddressFunding,
    isSubmittingSponsored,
  } = useWalletActions();

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isChangeAddressOpen, setIsChangeAddressOpen] = useState(false);
  const [isUnenrollOpen, setIsUnenrollOpen] = useState(false);
  const [isUnenrollModalOpen, setIsUnenrollModalOpen] = useState(false);
  const [isChangeAddressModalOpen, setIsChangeAddressModalOpen] =
    useState(false);

  useEffect(() => {
    if (optOutStatus === "loading") {
      setIsUnenrollModalOpen(true);
    }
    if (optOutStatus === "error") {
      setIsUnenrollModalOpen(false);
    }
  }, [optOutStatus]);

  useEffect(() => {
    if (
      !isUnenrollModalOpen ||
      isOptOutSubmitting ||
      optOutStatus !== "success"
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsUnenrollModalOpen(false);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [isUnenrollModalOpen, isOptOutSubmitting, optOutStatus]);

  useEffect(() => {
    if (changeAddressStatus === "loading") {
      setIsChangeAddressModalOpen(true);
    }
    if (changeAddressStatus === "error") {
      setIsChangeAddressModalOpen(false);
    }
  }, [changeAddressStatus]);

  useEffect(() => {
    if (
      !isChangeAddressModalOpen ||
      isChangeAddressSubmitting ||
      changeAddressStatus !== "success"
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsChangeAddressModalOpen(false);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [
    isChangeAddressModalOpen,
    isChangeAddressSubmitting,
    changeAddressStatus,
  ]);

  const handlePrimaryPress = useCallback(() => {
    if (!isConnected) {
      router.push("/login");
      return;
    }

    setIsActionSheetOpen(true);
  }, [isConnected]);

  const actions = useMemo(() => {
    const items: WalletAction[] = [
      {
        label: "Open in Explorer",
        icon: ArrowUpRight,
        onPress: () => {
          setIsActionSheetOpen(false);
          void openInExplorer();
        },
      },
      {
        label: "Switch account",
        icon: UserRound,
        onPress: () => {
          setIsActionSheetOpen(false);
          router.push("/settings/accounts");
        },
      },
    ];

    if (enrolledNextCycle) {
      items.push({
        label: "Change Reward Address",
        icon: Edit3,
        onPress: () => {
          setIsActionSheetOpen(false);
          setIsChangeAddressOpen(true);
        },
      });
      items.push({
        label: "Unenroll this account",
        icon: XCircle,
        destructive: true,
        onPress: () => {
          setIsActionSheetOpen(false);
          setIsUnenrollOpen(true);
        },
      });
    }

    return items;
  }, [enrolledNextCycle, openInExplorer]);

  return (
    <>
      <WalletTrigger
        variant="dual-stacking"
        buttonLabel={buttonLabel}
        isConnected={isConnected}
        isLoading={isLoading}
        onPress={handlePrimaryPress}
      />

      <WalletActionSheet
        open={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        address={stxAddress}
        btcAddress={btcAddress}
        actions={actions}
      />

      <ChangeRewardAddressSheet
        open={isChangeAddressOpen}
        onOpenChange={setIsChangeAddressOpen}
        onChangeRewardAddress={changeRewardAddress}
        onSponsoredChangeRewardAddress={changeRewardAddressSponsored}
        isSponsoredSubmitting={isSubmittingSponsored}
      />

      <UnenrollSheet
        open={isUnenrollOpen}
        onOpenChange={setIsUnenrollOpen}
        onGoBack={() => setIsActionSheetOpen(true)}
        onConfirm={({ reasons, feeMicroStx }) =>
          optOut({ reasons, feeMicroStx })
        }
        onSponsoredConfirm={({ reasons, feeMicroStx }) =>
          optOutSponsored({ reasons, feeMicroStx })
        }
        isSponsoredSubmitting={isSubmittingSponsored}
      />

      <TransactionStatusSheet
        open={isUnenrollModalOpen}
        onOpenChange={setIsUnenrollModalOpen}
        isLoading={isOptOutSubmitting}
        loading={{
          title:
            optOutFunding === "sponsored"
              ? "Queueing sponsored opt-out..."
              : "Processing your opt-out...",
          message:
            optOutFunding === "sponsored"
              ? "We are preparing your sponsored transaction and will broadcast it shortly."
              : "Please wait while we confirm your transaction on the blockchain.",
        }}
        success={{
          title:
            optOutFunding === "sponsored"
              ? "Opt-out queued"
              : "You are now unenrolled",
          message:
            optOutFunding === "sponsored"
              ? "Your sponsored opt-out will broadcast shortly."
              : "You'll stop earning Dual Stacking rewards from next cycle.",
        }}
      />

      <TransactionStatusSheet
        open={isChangeAddressModalOpen}
        onOpenChange={setIsChangeAddressModalOpen}
        isLoading={isChangeAddressSubmitting}
        loading={{
          title:
            changeAddressFunding === "sponsored"
              ? "Queueing sponsored update..."
              : "Updating reward address...",
          message:
            changeAddressFunding === "sponsored"
              ? "We are preparing your sponsored transaction and will broadcast it shortly."
              : "Please wait while we confirm your transaction on the blockchain.",
        }}
        success={{
          title:
            changeAddressFunding === "sponsored"
              ? "Address update queued"
              : "Reward address updated",
          message:
            changeAddressFunding === "sponsored"
              ? "Your sponsored address update will broadcast shortly."
              : "Your rewards will now be sent to the new address.",
        }}
      />
    </>
  );
}

export function ConnectedWallet({ variant = "default" }: ConnectedWalletProps) {
  return variant === "dual-stacking" ? (
    <DualStackingConnectedWallet />
  ) : (
    <DefaultConnectedWallet />
  );
}
