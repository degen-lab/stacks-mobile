import { type BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { InteractionManager } from "react-native";

import { FocusAwareStatusBar } from "@/components/ui";
import { WarningSheet } from "@/components/warning-sheet";
import { GooglePasswordScreen } from "@/features/login/components/google-password-screen";
import {
  useDeleteGoogleBackup,
  useRestoreWallet,
} from "@/hooks/use-create-wallet";
import { useAuth } from "@/lib/store/auth";

export default function WalletRestore() {
  const router = useRouter();
  const { restoreWallet } = useRestoreWallet();
  const { deleteBackupWithoutPassword } = useDeleteGoogleBackup();
  const { signOut } = useAuth();

  const deleteBackupSheetRef = useRef<BottomSheetModal>(null);
  const shouldNavigateAfterDeleteRef = useRef(false);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const handleRestore = useCallback(async () => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      await restoreWallet({ password });
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError("Restore failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [password, restoreWallet, router]);

  const handleForgotPassword = useCallback(() => {
    setDeleteError(undefined);
    deleteBackupSheetRef.current?.present();
  }, []);

  const handleDeleteBackup = useCallback(async () => {
    setDeleteError(undefined);
    setIsDeletingBackup(true);
    try {
      await deleteBackupWithoutPassword();
      shouldNavigateAfterDeleteRef.current = true;
      deleteBackupSheetRef.current?.dismiss();
    } catch (err) {
      console.error(err);
      setDeleteError("Failed to delete backup. Please try again.");
    } finally {
      setIsDeletingBackup(false);
    }
  }, [deleteBackupWithoutPassword]);

  const handleWarningSheetDismiss = useCallback(() => {
    if (shouldNavigateAfterDeleteRef.current) {
      shouldNavigateAfterDeleteRef.current = false;
      InteractionManager.runAfterInteractions(() =>
        router.replace("/wallet-new"),
      );
    }
  }, [router]);

  const handleBack = useCallback(async () => {
    await signOut();
    router.replace("/login");
  }, [signOut, router]);

  return (
    <>
      <FocusAwareStatusBar />
      <GooglePasswordScreen
        mode="recover"
        password={password}
        onPasswordChange={setPassword}
        onContinue={handleRestore}
        onForgotPassword={handleForgotPassword}
        onBack={handleBack}
        isLoading={isSubmitting}
        error={error}
      />
      <WarningSheet
        ref={deleteBackupSheetRef}
        title="Delete Google Backup?"
        description="To create a new wallet, we need to permanently delete your Google Drive backup. This action cannot be undone."
        onConfirm={handleDeleteBackup}
        onCancel={() => deleteBackupSheetRef.current?.dismiss()}
        loading={isDeletingBackup}
        error={deleteError}
        variant="danger"
        onDismiss={handleWarningSheetDismiss}
      />
    </>
  );
}
