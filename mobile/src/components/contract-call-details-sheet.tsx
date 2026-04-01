import { Button, Modal, Text, View, colors } from "@/components/ui";
import {
  BottomSheetScrollView,
  type BottomSheetModal,
} from "@gorhom/bottom-sheet";
import type { ClarityValue } from "@stacks/transactions";
import { useContractCallFee } from "@/hooks/use-contract-call-fee";
import { useColorScheme } from "nativewind";
import React from "react";
import { TransactionFundingActions } from "./transaction-funding-actions";
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
  showFeeSelector?: boolean;
  feeFunctionArgs?: ClarityValue[];
  stackingPrice?: number;
  confirmLabel?: string;
  onConfirm?: (feeMicroStx?: number) => void | Promise<void>;
  sponsoredConfirmLabel?: string;
  onSponsoredConfirm?: (feeMicroStx?: number) => void | Promise<void>;
  onClose?: () => void;
  extraContent?: React.ReactNode;
  snapPoints?: string[];
  enableDynamicSizing?: boolean;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  sponsoredConfirmDisabled?: boolean;
  isSponsoredLoading?: boolean;
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
      showFeeSelector = false,
      feeFunctionArgs = [],
      stackingPrice = 0,
      confirmLabel,
      onConfirm,
      sponsoredConfirmLabel = "Watch an ad",
      onSponsoredConfirm,
      onClose,
      extraContent,
      snapPoints,
      enableDynamicSizing = false,
      isLoading = false,
      confirmDisabled = false,
      sponsoredConfirmDisabled = false,
      isSponsoredLoading = false,
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
    const {
      selectedFeeOption,
      setSelectedFeeOption,
      customFee,
      setCustomFee,
      feeMicroStx,
      isFeeValid,
      isFeeUnavailable,
      isLoadingFees,
      resetFeeState,
    } = useContractCallFee({
      contractId: displayAddress,
      functionName: displayFunction,
      functionArgs: feeFunctionArgs,
      enabled:
        showFeeSelector &&
        Boolean(displayAddress) &&
        Boolean(displayFunction) &&
        !showSuccess,
    });

    const handleClose = React.useCallback(() => {
      setShowAdvancedOnly(false);
      if (showFeeSelector) {
        resetFeeState();
      }
      onClose?.();
    }, [onClose, resetFeeState, showFeeSelector]);

    const handleConfirm = React.useCallback(() => {
      onConfirm?.(showFeeSelector ? feeMicroStx : undefined);
    }, [feeMicroStx, onConfirm, showFeeSelector]);

    const handleSponsoredConfirm = React.useCallback(() => {
      onSponsoredConfirm?.(showFeeSelector ? feeMicroStx : undefined);
    }, [feeMicroStx, onSponsoredConfirm, showFeeSelector]);

    // Allow submission when fees aren't available — the wallet will estimate on confirmation
    const canUseWalletEstimatedFee =
      selectedFeeOption !== "custom" &&
      !isLoadingFees &&
      (feeMicroStx === undefined || isFeeUnavailable);
    const isConfirmDisabled =
      confirmDisabled ||
      isLoading ||
      isSponsoredLoading ||
      (showFeeSelector &&
        (isLoadingFees || (!isFeeValid && !canUseWalletEstimatedFee)));
    const isSponsoredDisabled =
      sponsoredConfirmDisabled ||
      isSponsoredLoading ||
      isLoading ||
      (showFeeSelector &&
        (isLoadingFees || (!isFeeValid && !canUseWalletEstimatedFee)));
    const showFundingChoice = Boolean(confirmLabel && onConfirm);
    const walletFundingLabel = confirmLabel ?? "Use wallet funds";

    return (
      <Modal
        ref={ref}
        snapPoints={enableDynamicSizing ? undefined : (snapPoints ?? ["65%"])}
        enableDynamicSizing={enableDynamicSizing}
        backgroundStyle={{
          backgroundColor: isDark ? colors.charcoal[850] : colors.white,
        }}
        onDismiss={handleClose}
      >
        <BottomSheetScrollView
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
                  onPress={handleClose}
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
                  title={title}
                  network={network || ""}
                  contractAddress={displayAddress}
                  functionName={displayFunction}
                  contractArgs={contractArgs}
                  showFeeSelector={showFeeSelector}
                  selectedFeeOption={selectedFeeOption}
                  onSelectFee={setSelectedFeeOption}
                  customFee={customFee}
                  onCustomFeeChange={setCustomFee}
                  feeMicroStx={feeMicroStx}
                  stackingPrice={stackingPrice}
                  isLoadingFees={isLoadingFees}
                  isFeeValid={isFeeValid}
                  isFeeUnavailable={isFeeUnavailable}
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
                    {showFundingChoice ? (
                      <TransactionFundingActions
                        sponsoredLabel={sponsoredConfirmLabel}
                        walletLabel={walletFundingLabel}
                        onPressSponsored={
                          onSponsoredConfirm
                            ? () => void handleSponsoredConfirm()
                            : undefined
                        }
                        onPressWallet={() => void handleConfirm()}
                        sponsoredDisabled={isSponsoredDisabled}
                        walletDisabled={isConfirmDisabled}
                        sponsoredLoading={isSponsoredLoading}
                        walletLoading={isLoading}
                      />
                    ) : (
                      <Button
                        label="Close"
                        variant="secondary"
                        size="lg"
                        onPress={handleClose}
                        className="mt-6"
                      />
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </BottomSheetScrollView>
      </Modal>
    );
  },
);

ContractCallDetailsSheet.displayName = "ContractCallDetailsSheet";
