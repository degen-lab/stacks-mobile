import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Button, Text } from "@/components/ui";
import { StackingOptionCard } from "../components/stacking-option-card";
import { StackingCalculator } from "../components/stacking-calculator";
import { PoolOptionsModal } from "../components/pool-options-modal";
import { ApprovePoolSheet } from "../components/approve-pool-sheet";
import { StackStxSheet } from "../components/stack-stx-sheet";
import { TransactionLoadingOverlay } from "@/components/transaction-loading-overlay";
import { FeeOption } from "../components/fee-selector";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { WarningLabel } from "@/components/warning-label";
import { StackingHistoryCard } from "../components/stacking-history-card";
import type { UserStackingDataRow } from "@/api/stacking";

interface PoolState {
  availableStxBalance: number;
  activePosition?: {
    lockedAmount: number;
    lockDuration: number;
    nextUnlockDays: number;
    status: "ACTIVE";
    poolName: string;
    rewardedStxAmount?: number | null;
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
  poxContract: string;
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
  selectedFeeOption: FeeOption;
  customFee: string;
  isFeeValid: boolean;
  isLoadingFees: boolean;
  feeMicroStx?: number;
}

interface UiState {
  showPoolOptions: boolean;
  isProcessing: boolean;
  isSponsoredSubmitting: boolean;
  isSponsoredApprovalBroadcasting: boolean;
  sponsoredApprovalLoadingCopy: {
    title: string;
    message: string;
  };
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
  onConfirmSponsoredApproval: () => void;
  onConfirmDelegate: () => void;
  onConfirmSponsoredDelegate: () => void;
  onSheetClose: () => void;
  onSelectFee: (option: FeeOption) => void;
  onCustomFeeChange: (value: string) => void;
  setShowPoolOptions: (show: boolean) => void;
  onLeavePool?: () => void;
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
    availableStxBalance,
    activePosition,
    stackingInfo,
    isMainnet,
    selectedNetwork,
    isLoadingPool,
    poolContract,
    poxContract,
  } = poolState;

  const {
    hasChanges,
    isValidUpdate,
    pendingAmount,
    hasSufficientFunds,
    calculate,
  } = formState;

  const {
    selectedFeeOption,
    customFee,
    isFeeValid,
    isLoadingFees,
    feeMicroStx,
  } = feeState;

  const {
    showPoolOptions,
    isProcessing,
    isSponsoredSubmitting,
    isSponsoredApprovalBroadcasting,
    sponsoredApprovalLoadingCopy,
    isApprovalPending,
    isDelegatePending,
    approvalSheetRef,
    delegateSheetRef,
  } = uiState;

  const {
    onUpdateChange,
    onStackOrIncrease,
    onConfirmApproval,
    onConfirmSponsoredApproval,
    onConfirmDelegate,
    onConfirmSponsoredDelegate,
    onSheetClose,
    onSelectFee,
    onCustomFeeChange,
    setShowPoolOptions,
    onLeavePool,
  } = actions;
  const { delegations, isLoading, isError } = stackingHistory;
  const registrationClosesIn = stackingInfo.timeTillRewardPhase || "~4 Days";
  const getCtaLabel = () => {
    if (isSponsoredApprovalBroadcasting) return "Broadcasting approval...";
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
    if (isSponsoredApprovalBroadcasting) return true;
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
                registrationClosesIn={registrationClosesIn}
                lockingTime="2-week cycles"
                minimumStx={41}
                activePosition={activePosition}
                price={stackingInfo.price}
                timeTillRewardPhase={stackingInfo.timeTillRewardPhase}
              />
            </View>

            <View className="mb-4">
              <StackingCalculator
                availableBalance={availableStxBalance}
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
        onLeavePool={onLeavePool}
      />

      <ApprovePoolSheet
        sheetRef={approvalSheetRef}
        onClose={onSheetClose}
        network={selectedNetwork}
        poolAddress={poolContract}
        poxContract={poxContract}
        selectedFeeOption={selectedFeeOption}
        onSelectFee={onSelectFee}
        customFee={customFee}
        onCustomFeeChange={onCustomFeeChange}
        isFeeValid={isFeeValid}
        isLoadingFees={isLoadingFees}
        feeMicroStx={feeMicroStx}
        stackingPrice={stackingInfo.price}
        onConfirm={onConfirmApproval}
        onSponsoredConfirm={onConfirmSponsoredApproval}
        isLoading={isProcessing || isApprovalPending}
        isSponsoredLoading={isSponsoredSubmitting}
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
        onSponsoredConfirm={onConfirmSponsoredDelegate}
        isProcessing={isProcessing}
        isSponsoredProcessing={
          isSponsoredSubmitting || isSponsoredApprovalBroadcasting
        }
        isWaitingForSponsoredApproval={isSponsoredApprovalBroadcasting}
        sponsoredApprovalStatusCopy={sponsoredApprovalLoadingCopy}
        inPreparePhase={stackingInfo.inPreparePhase}
        timeTillPreparePhase={stackingInfo.timeTillPreparePhase}
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
