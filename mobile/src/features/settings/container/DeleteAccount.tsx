import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WarningLabel } from "@/components/warning-label";
import { WarningSheet } from "@/components/warning-sheet";
import {
  Button,
  Checkbox,
  Pressable,
  ScreenHeader,
  ScrollView,
  Text,
  View,
  useModal,
} from "@/components/ui";
import { ViewMnemonicModal } from "@/features/wallet-manager/components/view-mnemonic-modal";

import { useDeleteAccountFlow } from "../hooks/use-delete-account-flow";

export default function DeleteAccountScreen() {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const recoveryPhraseModal = useModal();
  const confirmDeleteModal = useModal();
  const { deleteAccount, isDeleting } = useDeleteAccountFlow();
  const [savedRecoveryPhrase, setSavedRecoveryPhrase] = useState(false);
  const [understandsDeletion, setUnderstandsDeletion] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDelete = savedRecoveryPhrase && understandsDeletion && !isDeleting;

  const handleDeleteAccount = async () => {
    setDeleteError(null);

    try {
      await deleteAccount();
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again.",
      );
    }
  };

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Delete Account" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-6"
        contentContainerStyle={{
          paddingBottom: Math.max(32, bottomInset + 16),
        }}
      >
        <View className="gap-4">
          <WarningLabel label="Deleting your account is permanent." />

          <View className="rounded-2xl border border-surface-secondary bg-white p-5 dark:bg-surface-primary">
            <Text className="font-matter text-2xl text-primary">
              Before you continue
            </Text>
            <Text className="mt-3 text-base font-instrument-sans text-secondary">
              This permanently deletes your app account, the local wallet on
              this device, and any cloud backup tied to it.
            </Text>
            <Text className="mt-3 text-base font-instrument-sans text-secondary">
              Blockchain history and third-party records outside the app will
              remain. Wallet access can be lost unless your recovery phrase is
              saved somewhere safe.
            </Text>
            <Pressable
              onPress={recoveryPhraseModal.present}
              className="mt-4 self-start py-1"
              testID="view-recovery-phrase-button"
            >
              <Text className="font-instrument-sans text-sm text-primary underline">
                View Recovery Phrase
              </Text>
            </Pressable>

            <View className="mt-5 gap-4">
              <Checkbox
                checked={savedRecoveryPhrase}
                onChange={setSavedRecoveryPhrase}
                accessibilityLabel="Confirm recovery phrase is saved"
                label="I saved my recovery phrase somewhere safe."
                testID="delete-account-recovery-checkbox"
              />
              <Checkbox
                checked={understandsDeletion}
                onChange={setUnderstandsDeletion}
                accessibilityLabel="Confirm permanent deletion"
                label="I understand this permanently deletes my account, local wallet, and cloud backup if one exists."
                testID="delete-account-confirm-checkbox"
              />
            </View>

            <Button
              variant="destructive"
              size="lg"
              label="Delete Account"
              disabled={!canDelete}
              loading={isDeleting}
              onPress={confirmDeleteModal.present}
              testID="delete-account-submit"
              className="mt-6"
            />
          </View>
        </View>
      </ScrollView>

      <ViewMnemonicModal ref={recoveryPhraseModal.ref} />
      <WarningSheet
        ref={confirmDeleteModal.ref}
        title="Delete Account"
        description="This will permanently delete your app account, local wallet, and any cloud backup tied to this device. This action cannot be undone."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
        error={deleteError}
        onConfirm={() => {
          void handleDeleteAccount();
        }}
        onCancel={confirmDeleteModal.dismiss}
      />
    </View>
  );
}
