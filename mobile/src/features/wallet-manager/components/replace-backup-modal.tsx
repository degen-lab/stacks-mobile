import { Button, Modal, ScrollView, Text, View } from "@/components/ui";
import { WarningLabel } from "@/components/warning-label";
import { useAuth } from "@/lib/store/auth";
import { useActiveAccountIndex } from "@/lib/store/settings";
import { walletKit } from "@/lib/wallet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import * as Clipboard from "expo-clipboard";
import { ArrowLeft, ClipboardPaste } from "lucide-react-native";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { showMessage } from "react-native-flash-message";
import { MnemonicWordGrid } from "./mnemonic-grid";
import {
  BackupPasswordForm,
  validateBackupPasswords,
} from "./backup-password-form";

function isWordInWordlist(word: string): boolean {
  return wordlist.includes(word.toLowerCase().trim());
}

type ReplaceBackupModalProps = {
  onSuccess: () => void;
  onWalletReplaced?: () => void;
};

type Step = "mnemonic" | "password";

interface MnemonicValidation {
  isValid: boolean;
  wordCount: number;
  filledCount: number;
  error?: string;
  invalidWordIndices: number[];
}

function validateMnemonicWords(words: string[]): MnemonicValidation {
  const filledWords = words.filter((w) => w.trim().length > 0);
  const filledCount = filledWords.length;
  const invalidWordIndices: number[] = [];

  if (filledCount === 0) {
    return { isValid: false, wordCount: 0, filledCount: 0, invalidWordIndices: [] };
  }

  words.forEach((word, index) => {
    const trimmedWord = word.trim();
    if (trimmedWord.length > 0 && !isWordInWordlist(trimmedWord)) {
      invalidWordIndices.push(index);
    }
  });
  if (filledCount !== 12 && filledCount !== 24) {
    return {
      isValid: false,
      wordCount: filledCount,
      filledCount,
      error: "Mnemonic must be 12 or 24 words",
      invalidWordIndices,
    };
  }

  if (invalidWordIndices.length > 0) {
    return {
      isValid: false,
      wordCount: filledCount,
      filledCount,
      error: "Some words are not valid BIP39 words",
      invalidWordIndices,
    };
  }

  const mnemonicPhrase = filledWords.join(" ");
  let isValid = false;
  let error: string | undefined;

  try {
    isValid = validateMnemonic(mnemonicPhrase, wordlist);
    if (!isValid) {
      error = "Invalid mnemonic phrase. Checksum validation failed.";
    }
  } catch {
    isValid = false;
    error = "Invalid mnemonic phrase format";
  }

  return {
    isValid,
    wordCount: filledCount,
    filledCount,
    error,
    invalidWordIndices,
  };
}

interface MnemonicStepProps {
  words: string[];
  onWordChange: (index: number, word: string) => void;
  onPaste: () => void;
  onNext: () => void;
  validation: MnemonicValidation;
}

function MnemonicStep({
  words,
  onWordChange,
  onPaste,
  onNext,
  validation,
}: MnemonicStepProps) {
  return (
    <>
      <View className="mb-4">
        <WarningLabel label="Backup your current secret phrase key before proceeding." />
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-lg font-instrument-sans-medium text-primary">
          Enter Recovery Phrase
        </Text>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ClipboardPaste size={16} className="text-primary" />}
          label="Paste"
          onPress={onPaste}
        />
      </View>

      <View className="mb-3">
        <MnemonicWordGrid
          words={words}
          editable={true}
          wordCount={24}
          maxHeight={400}
          onWordChange={onWordChange}
          invalidWordIndices={validation.invalidWordIndices}
        />
      </View>

      {validation.filledCount > 0 && (
        <View className="mb-4 px-1">
          {validation.isValid && (
            <Text className="text-sm font-instrument-sans-medium text-green-600 mt-1">
              ✓ Valid mnemonic phrase
            </Text>
          )}
          {!validation.isValid && validation.filledCount > 0 && (
            <Text className="text-sm font-instrument-sans-medium text-red-600 mt-1">
              {validation.error || "Enter 12 or 24 valid words to continue"}
            </Text>
          )}
        </View>
      )}

      <Button
        variant="default"
        size="lg"
        label="Continue"
        onPress={onNext}
        disabled={!validation.isValid}
      />
    </>
  );
}
export const ReplaceBackupModal = forwardRef<
  BottomSheetModal,
  ReplaceBackupModalProps
>(({ onSuccess, onWalletReplaced }, ref) => {
  // State
  const [step, setStep] = useState<Step>("mnemonic");
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(
    Array(24).fill(""),
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setHasBackup } = useAuth();
  const { setActiveAccountIndex } = useActiveAccountIndex();

  const mnemonicValidation = useMemo(
    () => validateMnemonicWords(mnemonicWords),
    [mnemonicWords],
  );

  const passwordValidation = useMemo(
    () => validateBackupPasswords(password, confirmPassword),
    [password, confirmPassword],
  );

  // Handlers
  const handleModalOpen = useCallback(() => {
    setStep("mnemonic");
    setMnemonicWords(Array(24).fill(""));
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
  }, []);

  const handleWordChange = useCallback((index: number, word: string) => {
    setMnemonicWords((prev) => {
      const updated = [...prev];
      updated[index] = word.toLowerCase().trim();
      return updated;
    });
  }, []);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      const clipboardText = await Clipboard.getStringAsync();

      if (!clipboardText || !clipboardText.trim()) {
        showMessage({
          message: "Clipboard is empty",
          type: "warning",
        });
        return;
      }

      const words = clipboardText.trim().split(/\s+/).filter(Boolean);

      if (words.length !== 12 && words.length !== 24) {
        showMessage({
          message: `Found ${words.length} words. Expected 12 or 24`,
          type: "warning",
        });
        return;
      }

      const newWords = Array(24).fill("");
      words.forEach((word, i) => {
        if (i < 24) {
          newWords[i] = word.toLowerCase().trim();
        }
      });

      setMnemonicWords(newWords);
      showMessage({
        message: `✓ ${words.length} words pasted`,
        type: "success",
      });
    } catch (error) {
      console.error("Failed to paste:", error);
      showMessage({
        message: "Failed to paste from clipboard",
        type: "danger",
      });
    }
  }, []);

  const handleNextToPassword = useCallback(() => {
    if (!mnemonicValidation.isValid) {
      showMessage({
        message: "Please enter 12 or 24 words",
        type: "warning",
      });
      return;
    }
    setStep("password");
  }, [mnemonicValidation.isValid]);

  const handleBackToMnemonic = useCallback(() => {
    setStep("mnemonic");
  }, []);

  const handleImportWallet = useCallback(async () => {
    if (!mnemonicValidation.isValid || !passwordValidation.isValid) {
      showMessage({
        message: "Please complete all fields correctly",
        type: "warning",
      });
      return;
    }

    Alert.alert(
      "Replace Wallet?",
      "This will permanently replace your current wallet. Make sure you have backed up your current recovery phrase.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replace",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const filledWords = mnemonicWords
                .filter((w) => w.trim().length > 0)
                .map((w) => w.trim());

              const mnemonic = filledWords.join(" ");

              // Delete existing backup
              try {
                await walletKit.deleteBackupWithoutPassword();
              } catch (error: any) {
                if (!error?.message?.includes("not found")) {
                  console.warn("Failed to delete old backup:", error);
                }
              }

              // Store the new wallet (replaces local wallet + accounts)
              await walletKit.storeExistingWallet(mnemonic);
              await setActiveAccountIndex(0);

              // Create new backup
              await walletKit.backupWallet(password);
              setHasBackup(true);

              showMessage({
                message: "Wallet replaced and backed up successfully",
                type: "success",
              });

              onSuccess();
              onWalletReplaced?.();
            } catch (error: any) {
              console.error("Failed to replace wallet:", error);
              if (error?.code === "BACKUP_ALREADY_EXISTS") {
                setHasBackup(true);
                showMessage({
                  message:
                    "Backup already exists. Wallet was replaced locally.",
                  type: "info",
                });
                onSuccess();
                onWalletReplaced?.();
              } else {
                showMessage({
                  message: error?.message || "Failed to replace wallet",
                  type: "danger",
                });
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }, [
    mnemonicWords,
    password,
    mnemonicValidation,
    passwordValidation,
    onSuccess,
    onWalletReplaced,
    setHasBackup,
    setActiveAccountIndex,
  ]);

  return (
    <Modal
      ref={ref}
      snapPoints={["90%"]}
      title="Replace Cloud Backup"
      onAnimate={(from, to) => {
        if (to !== -1 && from === -1) {
          handleModalOpen();
        }
      }}
    >
      <ScrollView className="flex-1 px-4 pb-8">
        {step === "mnemonic" ? (
          <MnemonicStep
            words={mnemonicWords}
            onWordChange={handleWordChange}
            onPaste={handlePasteFromClipboard}
            onNext={handleNextToPassword}
            validation={mnemonicValidation}
          />
        ) : (
          <View className="gap-4">
            <View className="mb-4">
              <Button
                variant="outline"
                size="icon"
                onPress={handleBackToMnemonic}
                disabled={loading}
              >
                <ArrowLeft size={20} className="text-secondary" />
              </Button>
            </View>

            <WarningLabel label="Warning: This password cannot be reset. Keep it safe." />

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
              validation={passwordValidation}
              loading={loading}
              submitLabel="Replace & Backup Wallet"
              busyLabel="Replacing Wallet..."
              onSubmit={handleImportWallet}
            />
          </View>
        )}
      </ScrollView>
    </Modal>
  );
});

ReplaceBackupModal.displayName = "ReplaceBackupModal";
