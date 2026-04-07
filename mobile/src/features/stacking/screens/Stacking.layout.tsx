import React, { useMemo } from "react";
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
import type { StackingPosition } from "../types";
import { formatLockedUntilLabel } from "@/lib/utils/time";
import { formatMicroStx, fromStxToUstx } from "@/lib/format/currency";

interface PoolState {
  /** Fast Pool already allowed on PoX — user skips approval sheet. */
  hasPoolApproval: boolean;
  activePosition?: StackingPosition;
  stackingInfo: {
    apy: number;
    price: number;
    currentCycle: number;
    nextCycleStart?: Date;
    timeTillNextCycle?: string;
    timeTillRewardPhase?: string;
    inPreparePhase?: boolean;
    timeTillPreparePhase?: string;
  };
  daysPerCycle: number;
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
  delegateAmountStx: number;
  delegateAmountMicroStx: number;
  isDecreaseBlocked: boolean;
  isAlreadyStackedForNextCycle: boolean;
  requiresAdditionalFundsForIncrease: boolean;
  blockedStackingReason?: string;
  minimumRequiredLockedAmountLabel: string;
  calculatorMinimumAmountStx: number;
  maxLockableAmountStx: number;
  availableToAddAmountStx: number;
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
  isApprovalFeeValid: boolean;
  isDelegateFeeValid: boolean;
  isLoadingFees: boolean;
  approvalFeeMicroStx?: number;
  delegateFeeMicroStx?: number;
}

interface UiState {
  showPoolOptions: boolean;
  isProcessing: boolean;
  isSponsoredSubmitting: boolean;
  isSponsoredApprovalBroadcasting: boolean;
  isSponsoredDelegateBroadcasting: boolean;
  sponsoredApprovalLoadingCopy: {
    title: string;
    message: string;
  };
  sponsoredDelegateLoadingCopy: {
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
    hasPoolApproval,
    activePosition,
    stackingInfo,
    isMainnet,
    selectedNetwork,
    isLoadingPool,
    poolContract,
    poxContract,
    daysPerCycle,
  } = poolState;

  const {
    hasChanges,
    isValidUpdate,
    pendingAmount,
    delegateAmountStx,
    delegateAmountMicroStx,
    isDecreaseBlocked,
    isAlreadyStackedForNextCycle,
    requiresAdditionalFundsForIncrease,
    blockedStackingReason,
    minimumRequiredLockedAmountLabel,
    calculatorMinimumAmountStx,
    maxLockableAmountStx,
    availableToAddAmountStx,
    hasSufficientFunds,
    calculate,
  } = formState;

  const {
    selectedFeeOption,
    customFee,
    isApprovalFeeValid,
    isDelegateFeeValid,
    isLoadingFees,
    approvalFeeMicroStx,
    delegateFeeMicroStx,
  } = feeState;

  const {
    showPoolOptions,
    isProcessing,
    isSponsoredSubmitting,
    isSponsoredApprovalBroadcasting,
    isSponsoredDelegateBroadcasting,
    sponsoredApprovalLoadingCopy,
    sponsoredDelegateLoadingCopy,
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
  const isUnlocking = activePosition?.status === "UNLOCKING";

  /** Block-based countdown when PoX is ready; otherwise wall-clock from next cycle date (same as banner). */
  const cycleEndsInLabel = useMemo(() => {
    const ttc = stackingInfo.timeTillNextCycle;
    if (ttc && ttc !== "--") return ttc;
    if (stackingInfo.nextCycleStart) {
      return formatLockedUntilLabel(stackingInfo.nextCycleStart);
    }
    return isLoadingPool ? "…" : "—";
  }, [
    stackingInfo.timeTillNextCycle,
    stackingInfo.nextCycleStart,
    isLoadingPool,
  ]);

  const unlockingWarningLabel = useMemo(() => {
    if (!isUnlocking || !activePosition) return "";
    const amount = formatMicroStx(fromStxToUstx(activePosition.lockedAmount));
    return stackingInfo.nextCycleStart
      ? `Your ${amount} STX unlocks around ${formatLockedUntilLabel(stackingInfo.nextCycleStart)}.`
      : `Your ${amount} STX unlocks at the end of this cycle.`;
  }, [isUnlocking, activePosition, stackingInfo.nextCycleStart]);

  const getCtaLabel = () => {
    if (isSponsoredApprovalBroadcasting) return "Broadcasting approval...";
    if (isDecreaseBlocked) return "Cannot decrease locked amount";
    if (requiresAdditionalFundsForIncrease) return "Add Funds";
    if (isAlreadyStackedForNextCycle) return "Already stacked for next cycle";
    if (!hasSufficientFunds) return "Add Funds";
    if (isUnlocking) {
      if (!isValidUpdate)
        return `Enter at least ${minimumRequiredLockedAmountLabel} STX`;
      return "Set Next Cycle Amount";
    }
    if (!activePosition) return "Start Stacking";
    if (!hasChanges) return "No changes";

    if (activePosition && pendingAmount !== undefined) {
      if (pendingAmount < activePosition.lockedAmount)
        return "Cannot decrease locked amount";
      if (pendingAmount > activePosition.lockedAmount)
        return "Increase Stacking";
    }

    if (!isValidUpdate) return "Cannot apply";

    return "Update Position";
  };

  const isCtaDisabled = () => {
    if (!isMainnet) return true;
    if (isSponsoredApprovalBroadcasting) return true;
    if (isProcessing || isLoadingPool) return true;
    if (isDecreaseBlocked || isAlreadyStackedForNextCycle) {
      return !requiresAdditionalFundsForIncrease;
    }

    if (pendingAmount === undefined) return true;
    if (isUnlocking) return !isValidUpdate;
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
                minimumStx={40}
                activePosition={activePosition}
                price={stackingInfo.price}
                timeTillRewardPhase={stackingInfo.timeTillRewardPhase}
                cycleEndsInLabel={cycleEndsInLabel}
              />
            </View>

            {isUnlocking && activePosition && (
              <View className="mb-4">
                <WarningLabel label={unlockingWarningLabel} />
              </View>
            )}

            {blockedStackingReason && (
              <View className="mb-4">
                {isDecreaseBlocked && activePosition?.status === "UNLOCKING" ? (
                  <WarningLabel label="Fast Pool only supports increasing. To decrease amount, wait for your funds to unlock." />
                ) : isDecreaseBlocked && onLeavePool ? (
                  <WarningLabel label="Fast Pool only supports increasing. To decrease amount ">
                    <Text
                      className="font-instrument-sans text-sm underline"
                      onPress={onLeavePool}
                    >
                      leave pool
                    </Text>
                    {" and stack again after your funds unlock."}
                  </WarningLabel>
                ) : (
                  <WarningLabel label={blockedStackingReason} />
                )}
              </View>
            )}

            <View className="mb-4">
              <StackingCalculator
                activePosition={activePosition}
                onUpdateChange={onUpdateChange}
                calculate={calculate}
                price={stackingInfo.price}
                minimumAmount={calculatorMinimumAmountStx}
                maxLockableAmount={maxLockableAmountStx}
                availableToAddAmount={availableToAddAmountStx}
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
        cycleEndsInLabel={cycleEndsInLabel}
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
        isFeeValid={isApprovalFeeValid}
        isLoadingFees={isLoadingFees}
        feeMicroStx={approvalFeeMicroStx}
        stackingPrice={stackingInfo.price}
        onConfirm={onConfirmApproval}
        onSponsoredConfirm={onConfirmSponsoredApproval}
        isLoading={isProcessing || isApprovalPending}
        isSponsoredLoading={isSponsoredSubmitting}
        confirmDisabled={!isApprovalFeeValid}
        sheetTitle={isUnlocking ? "Step 1: Allow PoX access" : undefined}
      />

      <StackStxSheet
        sheetRef={delegateSheetRef}
        onClose={onSheetClose}
        isStacking={activePosition?.status === "ACTIVE"}
        flowTitle={
          isUnlocking
            ? hasPoolApproval
              ? "Delegate STX for next cycle"
              : "Step 2: Delegate STX"
            : undefined
        }
        pendingAmount={pendingAmount}
        delegateAmount={delegateAmountStx}
        delegateAmountMicroStx={delegateAmountMicroStx}
        stackingPrice={stackingInfo.price}
        network={selectedNetwork}
        poolAddress={poolContract}
        selectedFeeOption={selectedFeeOption}
        onSelectFee={onSelectFee}
        customFee={customFee}
        onCustomFeeChange={onCustomFeeChange}
        isFeeValid={isDelegateFeeValid}
        isLoadingFees={isLoadingFees}
        feeMicroStx={delegateFeeMicroStx}
        onConfirm={onConfirmDelegate}
        onSponsoredConfirm={onConfirmSponsoredDelegate}
        isProcessing={isProcessing}
        isSponsoredProcessing={
          isSponsoredSubmitting ||
          isSponsoredApprovalBroadcasting ||
          isSponsoredDelegateBroadcasting
        }
        isWaitingForSponsoredApproval={isSponsoredApprovalBroadcasting}
        sponsoredApprovalStatusCopy={
          isSponsoredApprovalBroadcasting
            ? sponsoredApprovalLoadingCopy
            : sponsoredDelegateLoadingCopy
        }
        inPreparePhase={stackingInfo.inPreparePhase}
        timeTillPreparePhase={stackingInfo.timeTillPreparePhase}
        nextCycleStart={stackingInfo.nextCycleStart}
        daysPerCycle={daysPerCycle}
      />

      <TransactionLoadingOverlay
        visible={
          isApprovalPending ||
          isDelegatePending ||
          isSponsoredDelegateBroadcasting
        }
        message={
          isApprovalPending
            ? "Approving Pool Access"
            : isDelegatePending
              ? "Broadcasting Delegation"
              : sponsoredDelegateLoadingCopy.title
        }
      />
    </KeyboardAvoidingView>
  );
}
