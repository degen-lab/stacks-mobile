import { useState, useEffect, useRef } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Button, Text, View } from "@/components/ui";
import { StackingOptionCard } from "../components/stacking-option-card";
import { StackingCalculator } from "../components/stacking-calculator";
import { PoolOptionsModal } from "../components/pool-options-modal";
import { ContractCallDetailsSheet } from "@/components/contract-call-details-sheet";
import { ReceiveSheet } from "@/features/earn/components/receive-sheet";
import { useStacking } from "../hooks/use-stacking";
import { useFastPool } from "@/api/stacks/fast-pool/use-fast-pool";
import { useTrackTx } from "../hooks/use-track-tx";
import { walletKit } from "@/lib/stacks/wallet";
import { useSelectedNetwork } from "@/lib/store/settings";
import { CONTRACTS } from "@/lib/stacks/contracts";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { formatAddress } from "@/lib/stacks/addresses";

const MICRO_STX = 1_000_000;

export function StackingScreen() {
  const { stackingInfo, daysPerCycle, calculate } = useStacking();

  const stxBalance = 60;
  const [address, setAddress] = useState<string>();
  const { selectedNetwork } = useSelectedNetwork();
  const approvalSheetRef = useRef<BottomSheetModal>(null);
  const delegateSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    walletKit.getWalletAccounts().then((accounts) => {
      const networkKey = selectedNetwork as "mainnet" | "testnet";
      if (accounts?.[0]?.addresses?.[networkKey]) {
        setAddress(accounts[0].addresses[networkKey]);
      }
    });
  }, [selectedNetwork]);

  const {
    status: poolStatus,
    isLoading: isLoadingPool,
    isAllowed,
    approveAsync,
    delegateAsync,
  } = useFastPool(address);

  const lockedStx = Number(poolStatus?.lockedAmountMicroStx ?? 0) / MICRO_STX;
  const isStacking = poolStatus?.isLocked ?? false;

  const activePosition = isStacking
    ? {
        lockedAmount: lockedStx,
        lockDuration: 1,
        nextUnlockDays: daysPerCycle,
        status: "ACTIVE" as const,
      }
    : undefined;

  const [hasChanges, setHasChanges] = useState(false);
  const [isValidUpdate, setIsValidUpdate] = useState(false);
  const [showPoolOptions, setShowPoolOptions] = useState(false);
  const [showReceiveSheet, setShowReceiveSheet] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | undefined>(
    undefined,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalTxId, setApprovalTxId] = useState<string | null>(null);
  const [delegateTxId, setDelegateTxId] = useState<string | null>(null);

  const { isPending: isApprovalPending } = useTrackTx({
    txId: approvalTxId,
    onSuccess: () => {
      setApprovalTxId(null);
      approvalSheetRef.current?.dismiss();
      setIsProcessing(false);
    },
    onFailure: (status) => {
      setApprovalTxId(null);
      setIsProcessing(false);
    },
  });
  const { isPending: isDelegatePending } = useTrackTx({
    txId: delegateTxId,
    onSuccess: () => {
      setDelegateTxId(null);
      delegateSheetRef.current?.dismiss();
      setIsProcessing(false);
    },
    onFailure: (status) => {
      setDelegateTxId(null);
      setIsProcessing(false);
    },
  });

  const handleConfirmApproval = async () => {
    setIsProcessing(true);
    try {
      const txId = await approveAsync();
      setApprovalTxId(txId);
      // Keep sheet open while transaction confirms
    } catch (error) {
      console.error("Failed to approve pool:", error);
      setIsProcessing(false);
      // TODO: Show error toast
    }
  };

  const handleAddFunds = () => {
    setShowReceiveSheet(true);
  };

  const handleConfirmDelegate = async () => {
    if (!pendingAmount) return;

    setIsProcessing(true);
    try {
      const amountMicroStx = Math.floor(pendingAmount * MICRO_STX);
      const txId = await delegateAsync(amountMicroStx);
      setDelegateTxId(txId);
    } catch (error) {
      console.error("Failed to delegate:", error);
      setIsProcessing(false);
    }
  };

  const handleStackOrIncrease = async () => {
    if (!hasSufficientFunds) {
      handleAddFunds();
      return;
    }

    if (!pendingAmount) return;

    if (!isAllowed) {
      approvalSheetRef.current?.present();
      return;
    }

    // Show delegate confirmation sheet
    delegateSheetRef.current?.present();
  };

  const handleMenuPress = () => {
    setShowPoolOptions(true);
  };

  const handleCalculatorUpdate = (
    changed: boolean,
    valid: boolean,
    newAmount?: number,
  ) => {
    setHasChanges(changed);
    setIsValidUpdate(valid);
    setPendingAmount(newAmount);
  };

  const poolContract = CONTRACTS[selectedNetwork].stackingFastPool;
  const isMainnet = selectedNetwork === "mainnet";

  const hasSufficientFunds = pendingAmount
    ? pendingAmount <= stxBalance
    : false;

  const getCtaLabel = () => {
    if (!hasSufficientFunds) return "Add Funds";
    if (!isStacking) return "Start Stacking";
    if (!hasChanges) return "No changes";
    if (!isValidUpdate) return "Cannot apply";

    if (activePosition && pendingAmount !== undefined) {
      if (pendingAmount > activePosition.lockedAmount)
        return "Increase Stacking";
      if (pendingAmount < activePosition.lockedAmount)
        return "Cannot decrease locked amount";
    }

    return "Update Position";
  };

  const isCtaDisabled = () => {
    if (!isMainnet) return true;
    if (isProcessing || isLoadingPool) return true;

    // Enable Add Funds button when insufficient funds
    if (!hasSufficientFunds) return false;

    // Disable if no amount entered
    if (!pendingAmount) return true;
    if (!isStacking) return !isValidUpdate;

    // For stacking: require valid changes and no decrease
    return (
      !hasChanges ||
      !isValidUpdate ||
      (activePosition &&
        pendingAmount !== undefined &&
        pendingAmount < activePosition.lockedAmount)
    );
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
                onMenuPress={handleMenuPress}
                activePosition={activePosition}
                price={stackingInfo.price}
              />
            </View>

            <View className="mb-4">
              <StackingCalculator
                availableBalance={stxBalance}
                activePosition={activePosition}
                onUpdateChange={handleCalculatorUpdate}
                calculate={calculate}
                price={stackingInfo.price}
              />
            </View>

            <Button
              label={getCtaLabel()}
              variant="gamePrimary"
              size="lg"
              onPress={handleStackOrIncrease}
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

      <ContractCallDetailsSheet
        ref={approvalSheetRef}
        title="Approve Stacking Pool"
        description="To use the Fast Pool for stacking, you need to approve the pool contract to delegate and lock your STX on your behalf. This is a one-time action."
        network={selectedNetwork}
        contractName={formatAddress(poolContract)}
        functionName="allow-contract-caller"
        feeLabel="Paid by you (one-time)"
        confirmLabel="Approve Pool"
        onConfirm={handleConfirmApproval}
        onClose={() => approvalSheetRef.current?.dismiss()}
        isLoading={isProcessing || isApprovalPending}
      />

      <ContractCallDetailsSheet
        ref={delegateSheetRef}
        title={isStacking ? "Increase Stacking" : "Start Stacking"}
        description={`You are about to ${isStacking ? "increase your stacking amount" : "delegate and lock"} ${pendingAmount?.toFixed(2)} STX to the Fast Pool. Your STX will be locked and earn rewards.`}
        network={selectedNetwork}
        contractName={formatAddress(poolContract)}
        functionName="delegate-stx"
        argsSummary={`Amount: ${pendingAmount?.toFixed(2)} STX`}
        feeLabel="Paid by you"
        confirmLabel={isStacking ? "Increase" : "Start Stacking"}
        onConfirm={handleConfirmDelegate}
        onClose={() => delegateSheetRef.current?.dismiss()}
        isLoading={isProcessing || isDelegatePending}
      />

      <ReceiveSheet
        open={showReceiveSheet}
        onClose={() => setShowReceiveSheet(false)}
      />
    </KeyboardAvoidingView>
  );
}
