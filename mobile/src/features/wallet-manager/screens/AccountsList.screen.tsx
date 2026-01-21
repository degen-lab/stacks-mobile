import {
  Button,
  Pressable,
  ScreenHeader,
  ScrollView,
  Text,
  View,
  useModal,
} from "@/components/ui";
import { WarningSheet } from "@/components/warning-sheet";
import { useDeleteGoogleBackup } from "@/hooks/use-create-wallet";
import { useAuth } from "@/lib/store/auth";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";
import { getAddressForNetwork } from "@/lib/addresses";
import { walletKit } from "@/lib/wallet";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { ChevronDown, Plus } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView as NativeScrollView,
} from "react-native";
import type { WalletAccount } from "@degenlab/stacks-wallet-kit-core";

import { AccountCard } from "../components/account-card";
import { ReplaceBackupModal } from "../components/replace-backup-modal";
import { SaveBackupModal } from "../components/save-backup-modal";
import { ViewMnemonicModal } from "../components/view-mnemonic-modal";

export default function AccountsListScreen() {
  const router = useRouter();
  const { selectedNetwork } = useSelectedNetwork();
  const { activeAccountIndex, setActiveAccountIndex } = useActiveAccountIndex();
  const { hasBackup } = useAuth();
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const scrollViewRef = useRef<NativeScrollView | null>(null);
  const shouldScrollToEndRef = useRef(false);
  const hasFocusedRef = useRef(false);

  const viewMnemonicModal = useModal();
  const deleteBackupModal = useModal();
  const replaceBackupModal = useModal();
  const saveBackupModal = useModal();
  const [deleteBackupLoading, setDeleteBackupLoading] = useState(false);
  const [deleteBackupError, setDeleteBackupError] = useState<string | null>(
    null,
  );
  const { setHasBackup } = useAuth();
  const { deleteBackupWithoutPassword } = useDeleteGoogleBackup();

  const loadAccounts = useCallback(
    async (options?: { useLoading?: boolean }) => {
      const { useLoading = true } = options ?? {};
      try {
        if (useLoading) {
          setLoading(true);
        }
        const walletAccounts = await walletKit.getWalletAccounts();
        setAccounts(walletAccounts as WalletAccount[]);
      } catch (error) {
        console.error("Failed to load accounts:", error);
        showMessage({
          message: "Failed to load accounts",
          type: "danger",
        });
      } finally {
        if (useLoading) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const handleWalletReplaced = useCallback(async () => {
    await setActiveAccountIndex(0);
    await loadAccounts({ useLoading: false });
  }, [loadAccounts, setActiveAccountIndex]);

  const handleDeleteBackup = useCallback(async () => {
    try {
      setDeleteBackupLoading(true);
      setDeleteBackupError(null);
      await deleteBackupWithoutPassword();
      showMessage({
        message: "Cloud backup deleted successfully",
        type: "success",
      });
      setHasBackup(false);
      deleteBackupModal.dismiss();
    } catch (error: any) {
      console.error("Failed to delete backup:", error);
      if (
        error?.message?.includes("not found") ||
        error?.code === "NOT_FOUND"
      ) {
        showMessage({
          message: "No cloud backup found",
          type: "info",
        });
        setHasBackup(false);
        deleteBackupModal.dismiss();
      } else {
        setDeleteBackupError("Failed to delete cloud backup");
        showMessage({
          message: "Failed to delete cloud backup",
          type: "danger",
        });
      }
    } finally {
      setDeleteBackupLoading(false);
    }
  }, [deleteBackupWithoutPassword, deleteBackupModal, setHasBackup]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedRef.current) {
        hasFocusedRef.current = true;
        return;
      }
      loadAccounts({ useLoading: false });
    }, [loadAccounts]),
  );

  const scrollToAccountsEnd = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleAddAccount = async () => {
    try {
      await walletKit.createAccount();
      shouldScrollToEndRef.current = true;
      await loadAccounts({ useLoading: false });
      showMessage({
        message: "Account created successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to create account:", error);
      shouldScrollToEndRef.current = false;
      showMessage({
        message: "Failed to create account",
        type: "danger",
      });
    }
  };

  const handleAccountPress = (accountIndex: number) => {
    router.push(`/settings/accounts/${accountIndex}` as any);
  };

  const handleSetActive = async (accountIndex: number) => {
    await setActiveAccountIndex(accountIndex);
    showMessage({
      message: `Account ${accountIndex + 1} is now active`,
      type: "success",
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtEnd =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 5;
    setIsScrolledToEnd(isAtEnd);
  };

  useEffect(() => {
    if (!shouldScrollToEndRef.current || accounts.length === 0) return;

    requestAnimationFrame(() => {
      scrollToAccountsEnd();
      shouldScrollToEndRef.current = false;
    });
  }, [accounts.length, scrollToAccountsEnd]);

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Wallet Accounts" />
      <View className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-base font-instrument-sans text-secondary">
              Loading accounts...
            </Text>
          </View>
        ) : (
          <View className="flex-1 flex-col">
            <View className="pt-4">
              <View style={{ position: "relative" }}>
                <ScrollView
                  ref={scrollViewRef}
                  className="mb-2"
                  style={{ maxHeight: 260 }}
                  showsVerticalScrollIndicator={accounts.length > 3}
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                >
                  <View className="gap-2.5">
                    {accounts.map((account) => {
                      const address = getAddressForNetwork(
                        account,
                        selectedNetwork,
                      );
                      return (
                        <AccountCard
                          key={account.index}
                          accountIndex={account.index}
                          address={address}
                          isActive={account.index === activeAccountIndex}
                          onPress={() => handleAccountPress(account.index)}
                          onSetActive={
                            account.index === activeAccountIndex
                              ? undefined
                              : () => handleSetActive(account.index)
                          }
                        />
                      );
                    })}
                  </View>
                </ScrollView>

                {accounts.length > 3 && !isScrolledToEnd && (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 32,
                    }}
                    pointerEvents="box-none"
                  >
                    <Pressable
                      style={{ flex: 1 }}
                      onPress={scrollToAccountsEnd}
                      accessibilityRole="button"
                      accessibilityLabel="Scroll to more accounts"
                    >
                      <LinearGradient
                        colors={["transparent", "rgba(0, 0, 0, 0.1)"]}
                        style={{
                          flex: 1,
                          justifyContent: "flex-end",
                          alignItems: "center",
                          paddingBottom: 8,
                        }}
                      >
                        <ChevronDown size={20} className="text-black" />
                      </LinearGradient>
                    </Pressable>
                  </View>
                )}
              </View>

              <Button
                variant="dashed"
                size="lg"
                leftIcon={<Plus size={18} className="text-primary" />}
                label="Add Account"
                onPress={handleAddAccount}
                accessibilityLabel="Add new account"
                loading={loading}
                className="my-4"
              />
            </View>

            <View className="mt-auto pb-12">
              <Text className="mb-3 px-1 text-xs font-instrument-sans-medium uppercase tracking-wide text-secondary">
                Backup & Security
              </Text>
              <View className="gap-1">
                <Button
                  variant="secondaryNavbar"
                  size="lg"
                  label="View Recovery Phrase"
                  onPress={viewMnemonicModal.present}
                />
                {hasBackup ? (
                  <>
                    <Button
                      variant="secondaryNavbar"
                      size="lg"
                      label="Replace Cloud Backup"
                      onPress={replaceBackupModal.present}
                    />
                    <Button
                      variant="destructive"
                      size="lg"
                      label="Delete Cloud Backup"
                      onPress={deleteBackupModal.present}
                    />
                  </>
                ) : (
                  <Button
                    variant="secondaryNavbar"
                    size="lg"
                    label="Save Cloud Backup"
                    onPress={saveBackupModal.present}
                  />
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      <ViewMnemonicModal ref={viewMnemonicModal.ref} />
      <WarningSheet
        ref={deleteBackupModal.ref}
        title="Delete Cloud Backup"
        description="Without a backup, losing this device means losing access to your funds unless you have your recovery phrase saved elsewhere."
        confirmLabel="Delete Backup"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteBackupLoading}
        error={deleteBackupError}
        onConfirm={handleDeleteBackup}
        onCancel={deleteBackupModal.dismiss}
        snapPoints={["40%"]}
      />
      <ReplaceBackupModal
        ref={replaceBackupModal.ref}
        onSuccess={replaceBackupModal.dismiss}
        onWalletReplaced={handleWalletReplaced}
      />
      <SaveBackupModal
        ref={saveBackupModal.ref}
        onSuccess={saveBackupModal.dismiss}
      />
    </View>
  );
}
