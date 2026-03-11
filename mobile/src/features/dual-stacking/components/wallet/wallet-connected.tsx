import {
  ArrowUpRight,
  ChevronDown,
  Copy,
  Edit3,
  XCircle,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable } from "react-native";

import { Text, View, colors } from "@/components/ui";
import { useAuth } from "@/lib/store/auth";
import { formatAddress } from "@/lib/stacks/addresses";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useEnrollmentStatus } from "@/features/dual-stacking/hooks/useEnrollmentStatus";

import { ChangeRewardAddressSheet } from "../layout/modals/change-reward-address-sheet";
import { UnenrollSheet } from "../layout/modals/unenroll-sheet";
import { TransactionStatusSheet } from "../layout/modals/transaction-status-sheet";
import { useWalletActions } from "../../hooks/use-wallet-actions";
import { WalletActionSheet } from "../layout/modals/wallet-action-sheet";

export default function ConnectWallet() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { stxAddress, isLoading } = useWalletAddresses();
  const { enrolledNextCycle } = useEnrollmentStatus();
  const {
    openInExplorer,
    copyAddress,
    optOut,
    changeRewardAddress,
    isOptOutSubmitting,
    optOutStatus,
    isChangeAddressSubmitting,
    changeAddressStatus,
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
      ? formatAddress(stxAddress)
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
      />

      <UnenrollSheet
        open={isUnenrollOpen}
        onOpenChange={setIsUnenrollOpen}
        onGoBack={() => setIsActionSheetOpen(true)}
        onConfirm={({ reasons, feeMicroStx }) =>
          optOut({ reasons, feeMicroStx })
        }
      />

      <TransactionStatusSheet
        open={isUnenrollModalOpen}
        onOpenChange={setIsUnenrollModalOpen}
        isLoading={isOptOutSubmitting}
        loading={{
          title: "Processing your opt-out...",
          message:
            "Please wait while we confirm your transaction on the blockchain.",
        }}
        success={{
          title: "You are now unenrolled",
          message: "You'll stop earning Dual Stacking rewards from next cycle.",
        }}
      />

      <TransactionStatusSheet
        open={isChangeAddressModalOpen}
        onOpenChange={setIsChangeAddressModalOpen}
        isLoading={isChangeAddressSubmitting}
        loading={{
          title: "Updating reward address...",
          message:
            "Please wait while we confirm your transaction on the blockchain.",
        }}
        success={{
          title: "Reward address updated",
          message: "Your rewards will now be sent to the new address.",
        }}
      />
    </>
  );
}
