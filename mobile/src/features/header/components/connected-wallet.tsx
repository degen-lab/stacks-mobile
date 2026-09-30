import {
  ArrowUpRight,
  ChevronDown,
  ExternalLink,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react-native";
import { router } from "expo-router";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { useCallback, useMemo, useState } from "react";
import { useColorScheme } from "nativewind";
import { Pressable } from "react-native";

import { Text, View, colors } from "@/components/ui";
import { useAuth } from "@/lib/store/auth";
import { truncateAddress } from "@/lib/stacks/addresses";
import { getExplorerUrl } from "@/lib/stacks/network";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { LeavePoolSheet } from "@/features/stacking/components/leave-pool-sheet";
import { useFastPoolActions } from "@/features/stacking/hooks/use-fast-pool-actions";

import { WalletActionSheet, type WalletAction } from "./wallet-action-sheet";

export type ConnectedWalletVariant = "default" | "stacking";

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isDefaultConnectedIcon = isConnected && variant === "default";
  const iconColor = isDark ? colors.charcoal[300] : colors.neutral[700];

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      hitSlop={8}
      className={
        isDefaultConnectedIcon
          ? "h-9 w-9 items-center justify-center rounded-lg border-2 border-surface-secondary bg-transparent active:opacity-90"
          : "flex-row items-center gap-1 rounded-lg border-2 border-surface-secondary bg-neutral-100 px-3 py-1.5 active:opacity-80 dark:bg-transparent"
      }
      accessibilityRole="button"
      accessibilityLabel={
        isConnected ? "Open connected wallet actions" : "Connect wallet"
      }
    >
      {isDefaultConnectedIcon ? (
        <View pointerEvents="none">
          <Wallet size={14} color={iconColor} />
        </View>
      ) : (
        <>
          <Text
            pointerEvents="none"
            className="font-instrument-sans text-xs font-semibold text-primary"
          >
            {buttonLabel}
          </Text>
          {isConnected ? (
            <View pointerEvents="none">
              <ChevronDown size={14} color={iconColor} />
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

function StackingConnectedWallet() {
  const { stxAddress, btcAddress, isConnected, isLoading, buttonLabel } =
    useWalletButtonState();
  const {
    status: poolStatus,
    selectedNetwork,
    isAllowed,
    poolContract,
    poxContract,
    revokeDelegation,
    revokeDelegationSponsored,
    disallowPoolPermission,
    disallowPoolPermissionSponsored,
  } = useFastPoolActions(stxAddress ?? undefined);
  const isStacking = poolStatus?.isLocked ?? false;

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isLeavePoolOpen, setIsLeavePoolOpen] = useState(false);

  const openFastPoolRewards = useCallback(async () => {
    if (!stxAddress) return;
    await openBrowserAsync(`https://fastpool.org/users/${stxAddress}`, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  }, [stxAddress]);

  const openInExplorer = useCallback(async () => {
    if (!stxAddress) return;
    await openBrowserAsync(getExplorerUrl(stxAddress).explorerUrl, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  }, [stxAddress]);

  const handlePrimaryPress = useCallback(() => {
    if (!isConnected) {
      router.push("/login");
      return;
    }
    setIsActionSheetOpen(true);
  }, [isConnected]);

  const handleRevoke = useCallback(
    async (feeMicroStx?: number) => revokeDelegation(feeMicroStx),
    [revokeDelegation],
  );

  const handleSponsoredRevoke = useCallback(
    async (feeMicroStx?: number) => revokeDelegationSponsored(feeMicroStx),
    [revokeDelegationSponsored],
  );

  const handleDisallow = useCallback(
    async (feeMicroStx?: number) => disallowPoolPermission(feeMicroStx),
    [disallowPoolPermission],
  );

  const handleSponsoredDisallow = useCallback(
    async (feeMicroStx?: number) =>
      disallowPoolPermissionSponsored(feeMicroStx),
    [disallowPoolPermissionSponsored],
  );

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

    if (isStacking) {
      items.push({
        label: "See your rewards",
        icon: ExternalLink,
        onPress: () => {
          setIsActionSheetOpen(false);
          void openFastPoolRewards();
        },
      });
    }

    if (isStacking || isAllowed) {
      items.push({
        label: "Leave Pool",
        icon: XCircle,
        destructive: true,
        onPress: () => {
          setIsActionSheetOpen(false);
          setIsLeavePoolOpen(true);
        },
      });
    }

    return items;
  }, [isAllowed, isStacking, openInExplorer, openFastPoolRewards]);

  return (
    <>
      <WalletTrigger
        variant="stacking"
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

      <LeavePoolSheet
        open={isLeavePoolOpen}
        onOpenChange={setIsLeavePoolOpen}
        network={selectedNetwork}
        poolContract={poolContract}
        poxContract={poxContract}
        isStacking={isStacking}
        isAllowed={Boolean(isAllowed)}
        onGoBack={() => setIsActionSheetOpen(true)}
        onRevoke={handleRevoke}
        onSponsoredRevoke={handleSponsoredRevoke}
        onDisallow={handleDisallow}
        onSponsoredDisallow={handleSponsoredDisallow}
      />
    </>
  );
}

export function ConnectedWallet({ variant = "default" }: ConnectedWalletProps) {
  if (variant === "stacking") return <StackingConnectedWallet />;
  return <DefaultConnectedWallet />;
}
