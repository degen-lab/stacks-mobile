import { Button, ScreenHeader, ScrollView, Text, View } from "@/components/ui";
import { BtcRouteLogo } from "@/components/ui/icons/btc-route-logo";
import { StacksRouteLogo } from "@/components/ui/icons/stacks-route-logo";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { getAddressForNetwork } from "@/lib/stacks/addresses";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";
import { walletKit } from "@/lib/stacks/wallet";
import { copyToClipboard } from "@/lib/clipboard";
import {
  BridgeAddressRow,
  BridgeFieldCard,
} from "@/features/sbtc-bridge/components/bridge-field-card";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Trash } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { showMessage } from "react-native-flash-message";
import type { WalletAccount } from "@degenlab/stacks-wallet-kit-core";

import { getAccountIcon } from "../components/account-icon";

export default function AccountDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedNetwork } = useSelectedNetwork();
  const { activeAccountIndex, setActiveAccountIndex } = useActiveAccountIndex();
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [totalAccounts, setTotalAccounts] = useState(0);

  const accountIndex = parseInt(id ?? "0", 10);
  const isActive = accountIndex === activeAccountIndex;
  const {
    stxAddress,
    btcAddress,
    isLoading: areAddressesLoading,
  } = useWalletAddresses({
    accountIndex,
  });

  const loadAccount = useCallback(async () => {
    try {
      setLoading(true);
      const walletAccounts = await walletKit.getWalletAccounts();
      const accounts = walletAccounts as WalletAccount[];
      setTotalAccounts(accounts.length);
      const foundAccount = accounts.find((acc) => acc.index === accountIndex);
      setAccount(foundAccount ?? null);
    } catch (error) {
      console.error("Failed to load account:", error);
      showMessage({
        message: "Failed to load account details",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [accountIndex]);

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  const handleSetActive = async () => {
    await setActiveAccountIndex(accountIndex);
    showMessage({
      message: `Account ${accountIndex + 1} is now active`,
      type: "success",
    });
  };

  const address = account
    ? (stxAddress ?? getAddressForNetwork(account, selectedNetwork))
    : null;
  const bitcoinAddress =
    btcAddress ?? (areAddressesLoading ? "Loading..." : null);
  const AccountIcon = getAccountIcon(accountIndex);

  const handleRemoveAccount = useCallback(async () => {
    try {
      setIsRemoving(true);
      const walletAccounts =
        (await walletKit.getWalletAccounts()) as WalletAccount[];
      const exists = walletAccounts.some((acc) => acc.index === accountIndex);

      if (!exists) {
        showMessage({
          message: "Account not found",
          type: "danger",
        });
        return;
      }

      // Prevent removing the last account
      if (walletAccounts.length <= 1) {
        showMessage({
          message: "Cannot remove the last account",
          type: "warning",
        });
        setIsRemoving(false);
        return;
      }

      await walletKit.removeWalletAccount(accountIndex);
      const nextAccounts =
        (await walletKit.getWalletAccounts()) as WalletAccount[];

      if (nextAccounts.length === 0) {
        await setActiveAccountIndex(0);
      } else {
        const stillHasActive = nextAccounts.some(
          (acc) => acc.index === activeAccountIndex,
        );

        if (!stillHasActive) {
          const sortedAccounts = [...nextAccounts].sort(
            (a, b) => a.index - b.index,
          );
          const fallbackAccount =
            sortedAccounts.find((acc) => acc.index < accountIndex) ??
            sortedAccounts[0];
          await setActiveAccountIndex(fallbackAccount.index);
        }
      }

      showMessage({
        message: "Account removed",
        type: "success",
      });
      router.back();
    } catch (error) {
      console.error("Failed to remove account:", error);
      showMessage({
        message: "Failed to remove account",
        type: "danger",
      });
    } finally {
      setIsRemoving(false);
    }
  }, [accountIndex, activeAccountIndex, router, setActiveAccountIndex]);

  const confirmRemoveAccount = useCallback(() => {
    if (!account || isRemoving) return;
    Alert.alert(
      "Remove Account",
      "This will delete the account from this device. You can restore it later using your recovery phrase.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: handleRemoveAccount,
        },
      ],
    );
  }, [account, handleRemoveAccount, isRemoving]);

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Account Details" />
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-base font-instrument-sans text-secondary">
            Loading...
          </Text>
        </View>
      ) : !account ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-base font-instrument-sans text-secondary text-center">
            Account not found
          </Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-5">
          <View className="w-full rounded-lg border border-surface-secondary bg-sand-100 p-5">
            <View className="mb-4 items-center">
              <View
                className={`mb-3 h-16 w-16 items-center justify-center rounded-full ${
                  isActive ? "bg-stacks-blood-orange" : "bg-sand-200"
                }`}
              >
                <AccountIcon
                  size={32}
                  className={isActive ? "text-white" : "text-primary"}
                />
              </View>
              <Text className="font-matter text-2xl text-primary">
                Account {account.index + 1}
              </Text>
            </View>

            <View className="mb-4 gap-3">
              {bitcoinAddress ? (
                <BridgeFieldCard label="Bitcoin" bgColor="white">
                  <BridgeAddressRow
                    leftSlot={<BtcRouteLogo size={20} />}
                    address={bitcoinAddress}
                    onCopy={
                      btcAddress
                        ? () =>
                            void copyToClipboard(btcAddress, "Address copied")
                        : undefined
                    }
                  />
                </BridgeFieldCard>
              ) : null}

              {address ? (
                <BridgeFieldCard label="Stacks" bgColor="white">
                  <BridgeAddressRow
                    leftSlot={<StacksRouteLogo size={20} />}
                    address={address}
                    onCopy={() =>
                      void copyToClipboard(address, "Address copied")
                    }
                  />
                </BridgeFieldCard>
              ) : null}
            </View>

            <View className="gap-3">
              {!isActive && (
                <Button
                  variant="default"
                  size="lg"
                  label="Set as Active Account"
                  leftIcon={<Check size={18} className="text-white" />}
                  onPress={handleSetActive}
                />
              )}
              {totalAccounts > 1 && (
                <Button
                  variant="destructive"
                  size="lg"
                  label="Remove Account"
                  leftIcon={<Trash size={18} className="text-white" />}
                  onPress={confirmRemoveAccount}
                  loading={isRemoving}
                />
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
