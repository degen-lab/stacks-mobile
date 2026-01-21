import { Modal, Text, View } from "@/components/ui";
import { useAuth } from "@/lib/store/auth";
import { walletKit } from "@/lib/wallet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setHasBackup } = useAuth();

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
        message: "Please enter a valid password and confirm it.",
        type: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      await walletKit.backupWallet(password);
      setHasBackup(true);
      showMessage({
        message: "Cloud backup saved successfully",
        type: "success",
      });
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save backup:", error);
      if (error?.code === "BACKUP_ALREADY_EXISTS") {
        setHasBackup(true);
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
  }, [password, validation.isValid, setHasBackup, onSuccess]);

  return (
    <Modal
      ref={ref}
      snapPoints={["70%"]}
      title="Save Cloud Backup"
      onAnimate={(from, to) => {
        if (to !== -1 && from === -1) {
          resetState();
        }
      }}
    >
      <View className="flex-1 px-4 pb-8 gap-4">
        <Text className="text-sm font-instrument-sans text-secondary">
          Set a strong password to encrypt your existing wallet before saving it
          to the cloud. Keep this password safe—you will need it to restore.
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
      </View>
    </Modal>
  );
});

SaveBackupModal.displayName = "SaveBackupModal";
