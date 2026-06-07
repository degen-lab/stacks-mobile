import { Modal, Text } from "@/components/ui";
import { useAuth } from "@/lib/store/auth";
import { walletKit } from "@/lib/stacks/wallet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useState } from "react";
import { showMessage } from "react-native-flash-message";

import {
  BackupPasswordForm,
  validateBackupPasswords,
} from "./backup-password-form";

type SaveBackupModalProps = {
  onSuccess: () => void;
};

export const SaveBackupModal = forwardRef<
  BottomSheetModal,
  SaveBackupModalProps
>(({ onSuccess }, ref) => {
  const { authMethod } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validation = validateBackupPasswords(password, confirmPassword);

  const resetState = useCallback(() => {
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
  }, []);

  const handleSaveBackup = useCallback(async () => {
    if (!validation.isValid) {
      showMessage({
        message: "Please enter a valid encryption passphrase and confirm it.",
        type: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      await walletKit.backupWallet(password, [
        authMethod === "apple" ? "apple" : "google",
      ]);
      showMessage({
        message: "Cloud backup saved successfully",
        type: "success",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save backup:", error);
      if (error?.code === "BACKUP_ALREADY_EXISTS") {
        showMessage({
          message: "A cloud backup already exists",
          type: "info",
        });
        onSuccess();
      } else {
        showMessage({
          message: error?.message || "Failed to save cloud backup",
          type: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [authMethod, password, validation.isValid, onSuccess]);

  return (
    <Modal
      ref={ref}
      enableDynamicSizing={true}
      title="Save Cloud Backup"
      onAnimate={(from, to) => {
        if (to !== -1 && from === -1) {
          resetState();
        }
      }}
    >
      <BottomSheetScrollView contentContainerClassName="px-4 pb-8 gap-4">
        <Text className="text-sm font-instrument-sans text-secondary">
          Set a strong encryption passphrase before saving your wallet to the
          cloud. Keep this passphrase safe; you will need it to restore.
        </Text>

        <BackupPasswordForm
          password={password}
          confirmPassword={confirmPassword}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onToggleShowPassword={() => setShowPassword(!showPassword)}
          onToggleShowConfirmPassword={() =>
            setShowConfirmPassword(!showConfirmPassword)
          }
          validation={validation}
          loading={loading}
          submitLabel="Save Cloud Backup"
          busyLabel="Saving Backup..."
          onSubmit={handleSaveBackup}
        />
      </BottomSheetScrollView>
    </Modal>
  );
});

SaveBackupModal.displayName = "SaveBackupModal";
