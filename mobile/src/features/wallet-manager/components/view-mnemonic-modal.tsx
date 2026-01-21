import { Button, Modal, Text, View } from "@/components/ui";
import { WarningLabel } from "@/components/warning-label";
import { useSecurityMethod } from "@/lib/store/settings";
import { walletKit } from "@/lib/wallet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Clipboard from "expo-clipboard";
import * as LocalAuthentication from "expo-local-authentication";
import { Copy, Eye, EyeOff } from "lucide-react-native";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { showMessage } from "react-native-flash-message";
import { MnemonicWordGrid } from "./mnemonic-grid";

export const ViewMnemonicModal = forwardRef<BottomSheetModal>((_, ref) => {
  const { securityMethod } = useSecurityMethod();
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const authenticateAndFetch = useCallback(async () => {
    try {
      setLoading(true);

      if (securityMethod === "biometrics") {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            "Biometrics Not Available",
            "Biometric authentication is not available on this device.",
          );
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to view recovery phrase",
          disableDeviceFallback: false,
          cancelLabel: "Cancel",
        });

        if (!result.success) {
          showMessage({
            message: "Authentication failed",
            type: "danger",
          });
          return;
        }
      }

      const storedMnemonic = await walletKit.getMnemonic();

      if (!storedMnemonic) {
        Alert.alert(
          "Recovery Phrase Not Found",
          "Your recovery phrase is not available locally. It may be stored in your cloud backup.",
        );
        return;
      }

      setMnemonic(storedMnemonic);
    } catch (error) {
      console.error("Failed to fetch mnemonic:", error);
      showMessage({
        message: "Failed to retrieve recovery phrase",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [securityMethod]);

  const handleCopyMnemonic = async () => {
    if (mnemonic) {
      await Clipboard.setStringAsync(mnemonic);
      showMessage({
        message: "Recovery phrase copied to clipboard",
        type: "success",
      });
    }
  };

  const handleModalOpen = useCallback(() => {
    setMnemonic(null);
    setRevealed(false);
    authenticateAndFetch();
  }, [authenticateAndFetch]);

  const words = useMemo(
    () => mnemonic?.trim().split(/\s+/).filter(Boolean) ?? [],
    [mnemonic],
  );

  return (
    <Modal
      ref={ref}
      snapPoints={["85%"]}
      title="Secret Recovery Phrase"
      onAnimate={(from, to) => {
        if (to !== -1 && from === -1) {
          handleModalOpen();
        }
      }}
    >
      <View className="flex-1 px-4 pb-8">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base font-instrument-sans text-secondary">
              Loading...
            </Text>
          </View>
        ) : mnemonic ? (
          <>
            <View className="mb-4">
              <WarningLabel
                label={`Keep this private. Anyone can access your funds with it.`}
              />
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-instrument-sans-medium text-primary">
                Recovery Phrase
              </Text>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Copy size={16} className="text-primary" />}
                label="Copy"
                onPress={handleCopyMnemonic}
                disabled={!mnemonic}
              />
            </View>

            <View className="mb-3">
              <MnemonicWordGrid words={words} revealed={revealed} />
            </View>

            <View className="gap-3">
              <Button
                variant="default"
                size="lg"
                leftIcon={
                  revealed ? (
                    <EyeOff size={18} className="text-white" />
                  ) : (
                    <Eye size={18} className="text-white" />
                  )
                }
                label={revealed ? "Hide mnemonic" : "Reveal mnemonic"}
                onPress={() => setRevealed((prev) => !prev)}
              />
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-base font-instrument-sans text-secondary text-center">
              Failed to load recovery phrase
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
});

ViewMnemonicModal.displayName = "ViewMnemonicModal";
