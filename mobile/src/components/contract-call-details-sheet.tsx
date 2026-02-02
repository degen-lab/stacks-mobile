import { Button, Modal, Text, View, colors } from "@/components/ui";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import React from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import {
  ContractTxDetails,
  type ContractArgument,
} from "./contract-tx-details";

type ContractCallDetailsSheetProps = {
  title?: string;
  description?: string;
  network?: string;
  contractAddress?: string;
  functionName?: string;
  contractArgs?: ContractArgument[];
  confirmLabel?: string;
  onConfirm?: () => void;
  onClose?: () => void;
  extraContent?: React.ReactNode;
  snapPoints?: string[];
  isLoading?: boolean;
  confirmDisabled?: boolean;
  showSuccess?: boolean;
  successMessage?: string;
  txId?: string;
};

export const ContractCallDetailsSheet = React.forwardRef<
  BottomSheetModal,
  ContractCallDetailsSheetProps
>(
  (
    {
      title = "Contract Call Details",
      description,
      network,
      contractAddress,
      functionName,
      contractArgs,
      confirmLabel,
      onConfirm,
      onClose,
      extraContent,
      snapPoints = ["65%"],
      isLoading = false,
      confirmDisabled = false,
      showSuccess = false,
      successMessage,
      txId,
    },
    ref,
  ) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";
    const [showAdvancedOnly, setShowAdvancedOnly] = React.useState(false);

    const displayAddress = contractAddress || "";
    const displayFunction = functionName || "";

    return (
      <Modal
        ref={ref}
        title={title}
        snapPoints={snapPoints}
        backgroundStyle={{
          backgroundColor: isDark ? colors.charcoal[850] : colors.white,
        }}
        onDismiss={onClose}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6">
            {showSuccess ? (
              <View className="items-center py-8">
                <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Text className="text-4xl">✓</Text>
                </View>
                <Text className="text-center text-lg font-matter text-primary">
                  {successMessage || "Transaction Confirmed!"}
                </Text>
                <Text className="mt-2 text-center text-sm font-instrument-sans text-secondary">
                  Your transaction has been successfully broadcasted.
                </Text>
                <Button
                  label="Done"
                  variant="gamePrimary"
                  size="lg"
                  onPress={onClose}
                  className="mt-6 w-full"
                />
              </View>
            ) : (
              <>
                {/* Description - Hidden when advanced mode is active */}
                {description && !showAdvancedOnly && (
                  <Text className="mb-6 text-center text-sm font-instrument-sans leading-relaxed text-secondary">
                    {description}
                  </Text>
                )}

                {/* Contract Details - Uses shared component */}
                <ContractTxDetails
                  network={network || ""}
                  contractAddress={displayAddress}
                  functionName={displayFunction}
                  contractArgs={contractArgs}
                  onAdvancedToggle={setShowAdvancedOnly}
                  txId={txId}
                />

                {/* Extra Content - Hidden when advanced mode is active */}
                {extraContent && !showAdvancedOnly && (
                  <View>{extraContent}</View>
                )}

                {/* Action Buttons - Hidden when advanced mode is active */}
                {!showAdvancedOnly && (
                  <>
                    {confirmLabel && onConfirm ? (
                      <View className="mt-6 gap-3">
                        <Button
                          // @ts-expect-error - Button label should accept ReactNode but types say string
                          label={
                            isLoading ? (
                              <View className="flex-row items-center justify-center gap-2">
                                <ActivityIndicator size="small" color="#fff" />
                                <Text className="font-matter text-base text-white">
                                  Processing...
                                </Text>
                              </View>
                            ) : (
                              confirmLabel
                            )
                          }
                          variant="gamePrimary"
                          size="lg"
                          onPress={onConfirm}
                          disabled={isLoading || confirmDisabled}
                        />
                        <Button
                          label="Cancel"
                          variant="secondary"
                          size="lg"
                          onPress={onClose}
                          disabled={isLoading}
                        />
                      </View>
                    ) : (
                      <Button
                        label="Close"
                        variant="secondary"
                        size="lg"
                        onPress={onClose}
                        className="mt-6"
                      />
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </Modal>
    );
  },
);

ContractCallDetailsSheet.displayName = "ContractCallDetailsSheet";
