import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { StackingOptionCard } from "../components/stacking-option-card";
import { StackingCalculator } from "../components/stacking-calculator";
import { PoolOptionsModal } from "../components/pool-options-modal";
import { TransferSheet } from "@/features/transfer";
import { ApprovePoolSheet } from "../components/approve-pool-sheet";
import { StackStxSheet } from "../components/stack-stx-sheet";
import { TransactionLoadingOverlay } from "@/components/transaction-loading-overlay";
import { FeeOption } from "../components/fee-selector";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { WarningLabel } from "@/components/warning-label";
import { StackingHistoryCard } from "../components/stacking-history-card";
import type { UserStackingDataRow } from "@/api/stacking";

interface PoolState {
  stxBalance: number;
  activePosition?: {
    lockedAmount: number;
    lockDuration: number;
    nextUnlockDays: number;
    status: "ACTIVE";
    poolName: string;
  };
  stackingInfo: {
    apy: number;
    price: number;
    currentCycle: number;
    timeTillNextCycle?: string;
    timeTillRewardPhase?: string;
    inPreparePhase?: boolean;
    timeTillPreparePhase?: string;
  };
  isMainnet: boolean;
  selectedNetwork: string;
  isLoadingPool: boolean;
  poolContract: string;
}

interface FormState {
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
}

interface FeeState {
  feeLabel: string;
  selectedFeeOption: FeeOption;
  customFee: string;
  isFeeValid: boolean;
  isLoadingFees: boolean;
  feeMicroStx?: number;
}

interface UiState {
  showPoolOptions: boolean;
  showTransferSheet: boolean;
  isProcessing: boolean;
  isApprovalPending: boolean;
  isDelegatePending: boolean;
  approvalSheetRef: React.RefObject<BottomSheetModal | null>;
  delegateSheetRef: React.RefObject<BottomSheetModal | null>;
}

interface Actions {
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
  setShowTransferSheet: (show: boolean) => void;
  onRevoke?: () => void;
}

interface StackingHistoryState {
  delegations: UserStackingDataRow[];
  isLoading: boolean;
  isError: boolean;
}

interface StackingScreenLayoutProps {
  poolState: PoolState;
  formState: FormState;
  feeState: FeeState;
  uiState: UiState;
  actions: Actions;
  stackingHistory: StackingHistoryState;
}

export function StackingScreenLayout({
  poolState,
  formState,
  feeState,
  uiState,
  actions,
  stackingHistory,
}: StackingScreenLayoutProps) {
  const {
    stxBalance,
    activePosition,
    stackingInfo,
    isMainnet,
    selectedNetwork,
    isLoadingPool,
    poolContract,
  } = poolState;

  const {
    hasChanges,
    isValidUpdate,
    pendingAmount,
    hasSufficientFunds,
    calculate,
  } = formState;

  const {
    feeLabel,
    selectedFeeOption,
    customFee,
    isFeeValid,
    isLoadingFees,
    feeMicroStx,
  } = feeState;

  const {
    showPoolOptions,
    showTransferSheet,
    isProcessing,
    isApprovalPending,
    isDelegatePending,
    approvalSheetRef,
    delegateSheetRef,
  } = uiState;

  const {
    onUpdateChange,
    onStackOrIncrease,
    onConfirmApproval,
    onConfirmDelegate,
    onSheetClose,
    onSelectFee,
    onCustomFeeChange,
    setShowPoolOptions,
    setShowTransferSheet,
    onRevoke,
  } = actions;
  const { delegations, isLoading, isError } = stackingHistory;
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
              <View className="my-2">
                <WarningLabel label="Stacking is only available on mainnet." />
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-3 font-matter text-xl text-primary">
                {activePosition
                  ? "Your stacking pool"
                  : "Available stacking pools"}
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

            <View className="mt-5">
              <Text className="mb-3 font-matter text-xl text-primary">
                Stacking history
              </Text>
              <StackingHistoryCard
                delegations={delegations}
                isLoading={isLoading}
                isError={isError}
              />
            </View>
          </View>
        </ScrollView>
      </View>
      <PoolOptionsModal
        visible={showPoolOptions}
        onClose={() => setShowPoolOptions(false)}
        activePosition={activePosition}
        onRevoke={onRevoke}
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
        isLoadingFees={isLoadingFees}
        feeMicroStx={feeMicroStx}
        onConfirm={onConfirmDelegate}
        isProcessing={isProcessing}
        inPreparePhase={stackingInfo.inPreparePhase}
        timeTillPreparePhase={stackingInfo.timeTillPreparePhase}
      />

      <TransferSheet
        open={showTransferSheet}
        onClose={() => setShowTransferSheet(false)}
      />

      <TransactionLoadingOverlay
        visible={isApprovalPending || isDelegatePending}
        message={
          isApprovalPending
            ? "Approving Pool Access"
            : "Broadcasting Delegation"
        }
      />
    </KeyboardAvoidingView>
  );
}
