import {
  ArrowUpRight,
  ChevronDown,
  Copy,
  Edit3,
  XCircle,
} from "lucide-react-native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";

import { Text, View, colors } from "@/components/ui";
import { useAuth } from "@/lib/store/auth";
import { truncateAddress } from "@/lib/stacks/addresses";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useEnrollmentStatus } from "@/features/dual-stacking/hooks/use-enrollment-status";

import { ChangeRewardAddressSheet } from "../layout/modals/change-reward-address-sheet";
import { UnenrollSheet } from "../layout/modals/unenroll-sheet";
import { TransactionStatusSheet } from "../layout/modals/transaction-status-sheet";
import { useWalletActions } from "../../hooks/use-wallet-actions";
import { WalletActionSheet } from "../layout/modals/wallet-action-sheet";

export default function ConnectWallet() {
  const { isAuthenticated } = useAuth();
  const { stxAddress, isLoading } = useWalletAddresses();
  const { enrolledNextCycle } = useEnrollmentStatus();
  const {
    openInExplorer,
    copyAddress,
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

  const isConnected = isAuthenticated && Boolean(stxAddress);
  const buttonLabel = isLoading
    ? "Loading..."
    : isConnected && stxAddress
      ? truncateAddress(stxAddress)
      : "Connect";

  const handlePrimaryPress = () => {
    if (!isConnected) {
      router.push("/login");
      return;
    }

    setIsActionSheetOpen(true);
  };

  return (
    <>
      <Pressable
        onPress={handlePrimaryPress}
        disabled={isLoading}
        className="flex-row items-center gap-1 rounded-lg border-2 border-surface-secondary bg-neutral-100 px-3 py-1.5 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={
          isConnected ? "Open connected wallet actions" : "Connect wallet"
        }
      >
        <Text className="font-instrument-sans text-xs font-semibold text-primary">
          {buttonLabel}
        </Text>
        {isConnected && (
          <View pointerEvents="none">
            <ChevronDown size={14} color={colors.neutral[700]} />
          </View>
        )}
      </Pressable>

      <WalletActionSheet
        open={isActionSheetOpen}
        onOpenChange={setIsActionSheetOpen}
        address={stxAddress}
        actions={[
          {
            label: "Open in Explorer",
            icon: ArrowUpRight,
            onPress: () => {
              setIsActionSheetOpen(false);
              void openInExplorer();
            },
          },
          {
            label: "Copy address",
            icon: Copy,
            onPress: () => {
              setIsActionSheetOpen(false);
              void copyAddress();
            },
          },
          ...(enrolledNextCycle
            ? [
                {
                  label: "Change Reward Address",
                  icon: Edit3,
                  onPress: () => {
                    setIsActionSheetOpen(false);
                    setIsChangeAddressOpen(true);
                  },
                },
              ]
            : []),
          ...(enrolledNextCycle
            ? [
                {
                  label: "Unenroll this account",
                  icon: XCircle,
                  destructive: true,
                  onPress: () => {
                    setIsActionSheetOpen(false);
                    setIsUnenrollOpen(true);
                  },
                },
              ]
            : []),
        ]}
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
