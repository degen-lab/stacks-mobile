import { Button, ScreenHeader, ScrollView, Text, View } from "@/components/ui";
import { getAddressForNetwork } from "@/lib/addresses";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";
import { walletKit } from "@/lib/wallet";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Copy, Wallet, Check, Trash } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { showMessage } from "react-native-flash-message";
import type { WalletAccount } from "@degenlab/stacks-wallet-kit-core";

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

  const handleCopyAddress = async () => {
    if (account) {
      const address = getAddressForNetwork(account, selectedNetwork);
      await Clipboard.setStringAsync(address);
      showMessage({
        message: "Address copied to clipboard",
        type: "success",
      });
    }
  };

  const handleSetActive = async () => {
    await setActiveAccountIndex(accountIndex);
    showMessage({
      message: `Account ${accountIndex + 1} is now active`,
      type: "success",
    });
  };

  const address = account
    ? getAddressForNetwork(account, selectedNetwork)
    : undefined;

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
      router.replace("/settings/accounts" as any);
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
      <ScreenHeader
        title={account ? `Account ${account.index + 1}` : "Account Details"}
      />
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
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-sand-200">
                <Wallet size={32} className="text-primary" />
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-matter text-2xl text-primary">
                  Account {account.index + 1}
                </Text>
                {isActive && (
                  <View className="rounded-full bg-black px-3 py-1">
                    <Text className="text-xs font-instrument-sans-medium text-white">
                      Active
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-xs font-instrument-sans-medium uppercase tracking-wide text-secondary">
                {selectedNetwork === "mainnet" ? "Mainnet" : "Testnet"} Address
              </Text>
              <View className="rounded-lg bg-sand-200 p-3">
                <Text
                  className="font-mono text-xs text-primary leading-5"
                  selectable
                >
                  {address}
                </Text>
              </View>
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
              <Button
                variant="outline"
                size="lg"
                label="Copy Address"
                leftIcon={<Copy size={18} className="text-primary" />}
                onPress={handleCopyAddress}
              />
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
