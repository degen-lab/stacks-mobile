import React from "react";
import { View, Image, ScrollView } from "react-native";
import { Button, Text, Modal, Input, colors } from "@/components/ui";
import { WarningLabel } from "@/components/warning-label";
import { FeeSelector, FeeOption } from "../components/fee-selector";
import { ContractTxDetails } from "@/components/contract-tx-details";
import { formatMicroStx, MICRO_STX } from "@/lib/format/currency";
import { useColorScheme } from "nativewind";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

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
  isProcessing: boolean;
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
  isProcessing,
  inPreparePhase,
  timeTillPreparePhase,
}: StackStxSheetProps) {
  const { colorScheme } = useColorScheme();
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

  return (
    <Modal
      ref={sheetRef}
      snapPoints={["65%"]}
      backgroundStyle={{
        backgroundColor:
          colorScheme === "dark" ? colors.charcoal[850] : colors.white,
      }}
      onDismiss={onClose}
    >
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

              <View className="mb-6 rounded-xl bg-sand-50 px-4 py-3 dark:bg-sand-900/30">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="font-instrument-sans text-sm text-secondary">
                      Network fee
                    </Text>
                    {selectedFeeOption === "custom" && showFeeSelector ? (
                      <Input
                        placeholder={`${formatMicroStx(feeMicroStx || 0)} STX`}
                        keyboardType="decimal-pad"
                        value={customFee}
                        onChangeText={onCustomFeeChange}
                        className="mt-0.5 h-6 border-0 border-b border-surface-secondary bg-transparent p-0 font-instrument-sans-medium text-base leading-6 text-primary"
                        autoFocus={true}
                      />
                    ) : (
                      <Text className="mt-0.5 font-instrument-sans-medium text-base leading-6 text-primary">
                        {formatMicroStx(feeMicroStx || 0)} STX • $
                        {(
                          (feeMicroStx ? feeMicroStx / MICRO_STX : 0) *
                          stackingPrice
                        ).toFixed(3)}
                      </Text>
                    )}
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
              <View className="gap-3">
                <Button
                  label={isStacking ? "Confirm Increase" : "Start Stacking"}
                  variant="gamePrimary"
                  size="lg"
                  onPress={onConfirm}
                  disabled={!isFeeValid || isProcessing}
                />
                <Button
                  label="Cancel"
                  variant="secondary"
                  size="lg"
                  onPress={() => {
                    onClose();
                    sheetRef.current?.dismiss();
                  }}
                  disabled={isProcessing}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}
