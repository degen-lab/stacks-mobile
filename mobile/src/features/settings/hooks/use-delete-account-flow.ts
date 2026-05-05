import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { showMessage } from "react-native-flash-message";

import { useDeleteAccount } from "@/api/user";
import { useDeleteGoogleBackup } from "@/hooks/use-create-wallet";
import { clearLocalAccountData, useAuth } from "@/lib/store/auth";

const CLOUD_BACKUP_ERROR_MESSAGE =
  "Your account was deleted, but the cloud backup could not be removed.";
const DELETE_ACCOUNT_ERROR_MESSAGE =
  "Failed to delete account. Please try again.";
const LOCAL_CLEANUP_ERROR_MESSAGE =
  "Your account was deleted, but local cleanup did not finish. Please restart the app.";

const isBackupNotFoundError = (error: unknown) => {
  const message = (error as Error | undefined)?.message?.toLowerCase() ?? "";
  const code = (error as { code?: string } | undefined)?.code;

  return message.includes("not found") || code === "NOT_FOUND";
};
export function useDeleteAccountFlow() {
  const router = useRouter();
  const { hasBackup, setHasBackup } = useAuth();
  const { deleteBackupWithoutPassword } = useDeleteGoogleBackup();
  const deleteAccountMutation = useDeleteAccount();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = useCallback(async () => {
    if (isDeleting || deleteAccountMutation.isPending) {
      return;
    }

    setIsDeleting(true);
    let backupRemoved = false;
    let accountDeleted = false;
    let backupCleanupFailed = false;

    try {
      await deleteAccountMutation.mutateAsync();
      accountDeleted = true;

      if (hasBackup) {
        try {
          await deleteBackupWithoutPassword();
          backupRemoved = true;
        } catch (error) {
          if (!isBackupNotFoundError(error)) {
            console.error("Failed to delete cloud backup:", error);
            backupCleanupFailed = true;
          } else {
            backupRemoved = true;
          }
        }

        if (backupRemoved) {
          setHasBackup(false);
        }
      }

      await clearLocalAccountData({ throwOnFailure: true });

      showMessage({
        message: "Account deleted",
        description: backupCleanupFailed
          ? CLOUD_BACKUP_ERROR_MESSAGE
          : "Your app account and local wallet data were removed.",
        type: backupCleanupFailed ? "warning" : "success",
      });

      router.replace("/login");
    } catch (error) {
      if (accountDeleted) {
        throw new Error(LOCAL_CLEANUP_ERROR_MESSAGE);
      }

      if (error instanceof Error && error.message) {
        throw error;
      }

      throw new Error(DELETE_ACCOUNT_ERROR_MESSAGE);
    } finally {
      setIsDeleting(false);
    }
  }, [
    deleteAccountMutation,
    deleteBackupWithoutPassword,
    hasBackup,
    isDeleting,
    router,
    setHasBackup,
  ]);

  return {
    deleteAccount,
    isDeleting: isDeleting || deleteAccountMutation.isPending,
  } as const;
}
