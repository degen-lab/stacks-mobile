import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { StackingOptionCard } from "../components/stacking-option-card";
import { StackingCalculator } from "../components/stacking-calculator";
import { PoolOptionsModal } from "../components/pool-options-modal";

import { ReceiveSheet } from "@/features/earn/components/receive-sheet";
import { ApprovePoolSheet } from "../components/approve-pool-sheet";
import { StackStxSheet } from "../components/stack-stx-sheet";
import { FeeOption } from "../components/fee-selector";
import { FeeEstimation } from "@/api/stacks/types/fee";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

interface StackingScreenLayoutProps {
  // Pool State
  stxBalance: number;
  activePosition?: {
    lockedAmount: number;
    lockDuration: number;
    nextUnlockDays: number;
    status: "ACTIVE";
  };
  stackingInfo: {
    apy: number;
    price: number;
    timeTillNextCycle?: string;
    timeTillRewardPhase?: string;
    inPreparePhase?: boolean;
    timeTillPreparePhase?: string;
  };
  isMainnet: boolean;
  selectedNetwork: string;
  isLoadingPool: boolean;
  poolContract: string;

  // Form State
  hasChanges: boolean;
  isValidUpdate: boolean;
  pendingAmount?: number;
  hasSufficientFunds: boolean;
  calculate: (amount: number) => {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  } | null;

  // Fee State
  feeLabel: string;
  selectedFeeOption: FeeOption;
  customFee: string;
  isFeeValid: boolean;
  estimations: FeeEstimation[];
  isLoadingFees: boolean;
  feeMicroStx?: number;

  // UI State
  showPoolOptions: boolean;
  showReceiveSheet: boolean;
  isProcessing: boolean;
  isApprovalPending: boolean;
  approvalSheetRef: React.RefObject<BottomSheetModal | null>;
  delegateSheetRef: React.RefObject<BottomSheetModal | null>;

  // Actions
  onUpdateChange: (
    changed: boolean,
    valid: boolean,
    newAmount?: number,
  ) => void;
  onStackOrIncrease: () => void;
  onConfirmApproval: () => void;
  onConfirmDelegate: () => void;
  onSheetClose: () => void;
  onSelectFee: (option: FeeOption) => void;
  onCustomFeeChange: (value: string) => void;
  setShowPoolOptions: (show: boolean) => void;
  setShowReceiveSheet: (show: boolean) => void;
}

export function StackingScreenLayout({
  stxBalance,
  activePosition,
  stackingInfo,
  isMainnet,
  selectedNetwork,
  isLoadingPool,
  poolContract,
  hasChanges,
  isValidUpdate,
  pendingAmount,
  hasSufficientFunds,
  calculate,
  feeLabel,
  selectedFeeOption,
  customFee,
  isFeeValid,
  estimations,
  isLoadingFees,
  feeMicroStx,
  showPoolOptions,
  showReceiveSheet,
  isProcessing,
  isApprovalPending,
  approvalSheetRef,
  delegateSheetRef,
  onUpdateChange,
  onStackOrIncrease,
  onConfirmApproval,
  onConfirmDelegate,
  onSheetClose,
  onSelectFee,
  onCustomFeeChange,
  setShowPoolOptions,
  setShowReceiveSheet,
}: StackingScreenLayoutProps) {
  const getCtaLabel = () => {
    if (!hasSufficientFunds) return "Add Funds";
    if (!activePosition) return "Start Stacking";
    if (!hasChanges) return "No changes";

    if (activePosition && pendingAmount !== undefined) {
      if (pendingAmount < 0) return "Cannot decrease locked amount";
      if (pendingAmount > 0) return "Increase Stacking";
    }

    if (!isValidUpdate) return "Cannot apply";

    return "Update Position";
  };

  const isCtaDisabled = () => {
    if (!isMainnet) return true;
    if (isProcessing || isLoadingPool) return true;

    if (pendingAmount === undefined) return true;
    if (activePosition && pendingAmount <= 0) return true;

    if (!hasSufficientFunds) return false;
    if (!activePosition) return !isValidUpdate;

    return !hasChanges || !isValidUpdate;
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View className="flex-1 bg-surface-tertiary">
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-8"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="p-4">
            {!isMainnet && (
              <View className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
                <Text className="text-sm font-instrument-sans text-orange-900 dark:text-orange-100">
                  ⚠️ Stacking is only available on mainnet. Please switch
                  networks to stack.
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-3 font-matter text-xl text-primary">
                {activePosition ? "Your stacking pool" : "Available pools"}
              </Text>
              <StackingOptionCard
                title="Fast Pool"
                description="The oldest stacking pool on Stacks"
                apy={stackingInfo.apy}
                selected={true}
                onPress={() => {}}
                registrationStatus="open"
                registrationClosesIn={
                  stackingInfo.timeTillNextCycle || "~4 Days"
                }
                lockingTime="2-week cycles"
                minimumStx={40}
                onMenuPress={() => setShowPoolOptions(true)}
                activePosition={activePosition}
                price={stackingInfo.price}
                timeTillRewardPhase={stackingInfo.timeTillRewardPhase}
              />
            </View>

            <View className="mb-4">
              <StackingCalculator
                availableBalance={stxBalance}
                activePosition={activePosition}
                onUpdateChange={onUpdateChange}
                calculate={calculate}
                price={stackingInfo.price}
              />
            </View>

            <Button
              label={getCtaLabel()}
              variant="gamePrimary"
              size="lg"
              onPress={onStackOrIncrease}
              disabled={isCtaDisabled()}
              className={isCtaDisabled() ? "opacity-50" : ""}
            />

            <View className="mt-2 px-4">
              <Text className="text-center text-xs font-instrument-sans text-secondary">
                Rewards may vary with network conditions.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
      <PoolOptionsModal
        visible={showPoolOptions}
        onClose={() => setShowPoolOptions(false)}
        activePosition={activePosition}
      />

      <ApprovePoolSheet
        sheetRef={approvalSheetRef}
        onClose={onSheetClose}
        network={selectedNetwork}
        poolAddress={poolContract}
        feeLabel={feeLabel}
        selectedFeeOption={selectedFeeOption}
        onSelectFee={onSelectFee}
        customFee={customFee}
        onCustomFeeChange={onCustomFeeChange}
        isFeeValid={isFeeValid}
        isLoadingFees={isLoadingFees}
        feeMicroStx={feeMicroStx}
        stackingPrice={stackingInfo.price}
        onConfirm={onConfirmApproval}
        isLoading={isProcessing || isApprovalPending}
        confirmDisabled={!isFeeValid}
      />

      <StackStxSheet
        sheetRef={delegateSheetRef}
        onClose={onSheetClose}
        isStacking={!!activePosition}
        pendingAmount={pendingAmount}
        stackingPrice={stackingInfo.price}
        network={selectedNetwork}
        poolAddress={poolContract}
        selectedFeeOption={selectedFeeOption}
        onSelectFee={onSelectFee}
        customFee={customFee}
        onCustomFeeChange={onCustomFeeChange}
        isFeeValid={isFeeValid}
        estimations={estimations}
        isLoadingFees={isLoadingFees}
        feeMicroStx={feeMicroStx}
        onConfirm={onConfirmDelegate}
        isProcessing={isProcessing}
        inPreparePhase={stackingInfo.inPreparePhase}
        timeTillPreparePhase={stackingInfo.timeTillPreparePhase}
      />

      <ReceiveSheet
        open={showReceiveSheet}
        onClose={() => setShowReceiveSheet(false)}
      />
    </KeyboardAvoidingView>
  );
}
