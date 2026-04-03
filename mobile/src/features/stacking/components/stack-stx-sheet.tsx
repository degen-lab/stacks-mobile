import React from "react";
import { View, Image, ScrollView, TextInput } from "react-native";
import { Button, Text, Modal } from "@/components/ui";
import { WarningLabel } from "@/components/warning-label";
import { FeeSelector, FeeOption } from "../components/fee-selector";
import { ContractTxDetails } from "@/components/contract-tx-details";
import { formatMicroStx, MICRO_STX } from "@/lib/format/currency";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { TransactionFundingActions } from "@/components/transaction-funding-actions";

interface StackStxSheetProps {
  isVisible?: boolean;
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
  isStacking: boolean;
  pendingAmount?: number;
  stackingPrice: number;
  network: string;
  poolAddress: string;
  selectedFeeOption: FeeOption;
  onSelectFee: (option: FeeOption) => void;
  customFee: string;
  onCustomFeeChange: (value: string) => void;
  isFeeValid: boolean;
  isLoadingFees: boolean;
  feeMicroStx?: number;
  onConfirm: () => void;
  onSponsoredConfirm?: () => void;
  isProcessing: boolean;
  isSponsoredProcessing?: boolean;
  inPreparePhase?: boolean;
  timeTillPreparePhase?: string;
}

export function StackStxSheet({
  sheetRef,
  onClose,
  isStacking,
  pendingAmount,
  stackingPrice,
  network,
  poolAddress,
  selectedFeeOption,
  onSelectFee,
  customFee,
  onCustomFeeChange,
  isFeeValid,
  isLoadingFees,
  feeMicroStx,
  onConfirm,
  onSponsoredConfirm,
  isProcessing,
  isSponsoredProcessing = false,
  inPreparePhase,
  timeTillPreparePhase,
}: StackStxSheetProps) {
  const [showAdvancedOnly, setShowAdvancedOnly] = React.useState(false);
  const [showFeeSelector, setShowFeeSelector] = React.useState(false);

  const estimatedUnlockDate = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);
  const feeDisplayLabel =
    selectedFeeOption === "custom" && customFee && !showFeeSelector
      ? `${customFee} STX`
      : `${formatMicroStx(feeMicroStx || 0)} STX • $${(
          (feeMicroStx ? feeMicroStx / MICRO_STX : 0) * stackingPrice
        ).toFixed(3)}`;

  return (
    <Modal ref={sheetRef} snapPoints={["75%"]} onDismiss={onClose}>
      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <View className="px-6">
          {/* Contract Details with Title */}
          <ContractTxDetails
            title={isStacking ? "Confirm Increase" : "Start Stacking"}
            network={network}
            contractAddress={poolAddress}
            functionName="delegate-stx"
            contractArgs={[
              {
                name: "amount-ustx",
                value: pendingAmount
                  ? `${(pendingAmount * MICRO_STX).toLocaleString()} µSTX`
                  : "0",
                type: "uint",
              },
              {
                name: "amount-stx",
                value: pendingAmount ? `${pendingAmount.toFixed(6)} STX` : "0",
              },
              {
                name: "delegate-to",
                value: poolAddress,
                type: "principal",
              },
              {
                name: "until-burn-ht",
                value: "none",
                type: "optional uint",
              },
            ]}
            onAdvancedToggle={setShowAdvancedOnly}
          />

          {!showAdvancedOnly && (
            <>
              <View className="mb-4 flex-row items-center justify-between rounded-xl border border-surface-secondary bg-sand-50 p-4 dark:bg-sand-900/30">
                <View className="flex-row items-center gap-3">
                  <Image
                    source={require("@/assets/images/fast-pool-logo.png")}
                    className="h-10 w-10"
                  />
                  <View>
                    <Text className="font-matter text-base text-primary">
                      Fast Pool
                    </Text>
                    <Text className="font-instrument-sans text-xs text-secondary">
                      Non-custodial
                    </Text>
                  </View>
                </View>
                {pendingAmount && (
                  <View className="items-end">
                    <Text className="font-matter text-xl text-primary">
                      {pendingAmount.toFixed(2)} STX
                    </Text>
                    <Text className="font-instrument-sans text-xs text-secondary">
                      ${(pendingAmount * stackingPrice).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Lock Period Details */}
              <View className="mb-4 rounded-xl bg-sand-50 px-4 py-3 dark:bg-sand-900/30">
                <View className="flex-row items-center justify-between">
                  <Text className="font-instrument-sans text-sm text-secondary">
                    Lock duration
                  </Text>
                  <Text className="font-instrument-sans-medium text-sm text-primary">
                    2 week cycles (auto-renews)
                  </Text>
                </View>
              </View>

              <View className="mb-6 rounded-xl border border-surface-secondary px-4 py-3 dark:border-border-primary">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-instrument-sans text-sm text-secondary">
                      Network fee
                    </Text>
                    <View className="mt-1 min-h-[24px] justify-center">
                      {selectedFeeOption === "custom" && showFeeSelector ? (
                        <TextInput
                          placeholder="Enter custom fee"
                          placeholderTextColor="rgb(var(--color-text-tertiary))"
                          keyboardType="decimal-pad"
                          value={customFee}
                          onChangeText={onCustomFeeChange}
                          className="border-0 border-b border-surface-secondary p-0 pb-1 font-instrument-sans-medium text-base text-primary dark:border-border-primary"
                          autoFocus
                          style={{
                            paddingVertical: 0,
                            textAlignVertical: "center",
                          }}
                        />
                      ) : (
                        <Text className="font-instrument-sans-medium text-base text-primary">
                          {feeDisplayLabel}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Button
                    label={showFeeSelector ? "Done" : "Edit"}
                    onPress={() => setShowFeeSelector(!showFeeSelector)}
                    variant="link"
                    size="sm"
                  />
                </View>
              </View>
              {showFeeSelector && (
                <View className="mb-4">
                  <FeeSelector
                    selectedFee={selectedFeeOption}
                    onSelectFee={onSelectFee}
                    isLoading={isLoadingFees}
                  />
                </View>
              )}

              <View className="my-4">
                <WarningLabel
                  label={
                    isStacking && !inPreparePhase && timeTillPreparePhase
                      ? `Only ${timeTillPreparePhase} left to increase for the next cycle`
                      : `This action will lock your funds until ~${estimatedUnlockDate}.`
                  }
                />
              </View>

              {/* Actions */}
              <TransactionFundingActions
                sponsoredLabel="Watch an ad"
                walletLabel="Use wallet funds"
                onPressSponsored={onSponsoredConfirm}
                onPressWallet={onConfirm}
                sponsoredDisabled={!isFeeValid || isProcessing}
                walletDisabled={!isFeeValid || isSponsoredProcessing}
                sponsoredLoading={isSponsoredProcessing}
                walletLoading={isProcessing}
              />
            </>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}
