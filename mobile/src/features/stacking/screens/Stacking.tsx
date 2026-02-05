import { useMemo, useState, useRef } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { formatMicroStx, MICRO_STX } from "@/lib/format/currency";
import { useStacking } from "../hooks/use-stacking";
import { useFastPool } from "@/api/stacks/fast-pool/use-fast-pool";
import {
  getAllowanceArgs,
  getDelegateArgs,
} from "@/api/stacks/fast-pool/fast-pool";
import { useTrackTx } from "../hooks/use-track-tx";
import { CONTRACTS } from "@/lib/stacks/contracts";
import { useFeeEstimation } from "@/api/stacks/use-fee";
import { FeeOption } from "../components/fee-selector";
import { StackingScreenLayout } from "./Stacking.layout";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { useSaveStackingDataMutation } from "@/api/stacking";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useSelectedNetwork } from "@/lib/store/settings";

export function StackingScreen() {
  const { stackingInfo, daysPerCycle, calculate } = useStacking();
  const { balance: stxBalance, lockedBalance } = useStxBalance();
  const { stxAddress: address } = useWalletAddresses();
  const { selectedNetwork } = useSelectedNetwork();

  const approvalSheetRef = useRef<BottomSheetModal>(null);
  const delegateSheetRef = useRef<BottomSheetModal>(null);

  const {
    status: poolStatus,
    isLoading: isLoadingPool,
    isAllowed,
    approveAsync,
    delegateAsync,
    revokeAsync,
  } = useFastPool(address ?? undefined);

  const isStacking = poolStatus?.isLocked ?? false;

  const activePosition = isStacking
    ? {
        lockedAmount: lockedBalance,
        lockDuration: 1,
        nextUnlockDays: daysPerCycle,
        status: "ACTIVE" as const,
        poolName: "Fast Pool",
      }
    : undefined;

  const saveStackingData = useSaveStackingDataMutation();

  const [hasChanges, setHasChanges] = useState(false);
  const [isValidUpdate, setIsValidUpdate] = useState(false);
  const [showPoolOptions, setShowPoolOptions] = useState(false);
  const [showTransferSheet, setShowTransferSheet] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | undefined>(
    undefined,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalTxId, setApprovalTxId] = useState<string | null>(null);
  const [delegateTxId, setDelegateTxId] = useState<string | null>(null);
  const [selectedFeeOption, setSelectedFeeOption] =
    useState<FeeOption>("standard");
  const [customFee, setCustomFee] = useState("");

  // Estimation State
  const [activeFeeFlow, setActiveFeeFlow] = useState<
    "approve" | "delegate" | null
  >(null);

  const poolContract = CONTRACTS[selectedNetwork].stackingFastPool;
  const isMainnet = selectedNetwork === "mainnet";
  const [contractAddress, contractName] = poolContract.split(".");

  const currentLockedStx = activePosition?.lockedAmount ?? 0;
  const pendingAmountStx = pendingAmount ?? 0;
  // pendingAmount from calculator already represents the TOTAL desired amount
  const totalStackingAmount = pendingAmountStx || currentLockedStx;
  const totalAmountMicroStx =
    totalStackingAmount > 0 ? Math.floor(totalStackingAmount * MICRO_STX) : 0;

  const feeEstimationArgs = useMemo(() => {
    if (activeFeeFlow === "approve") {
      return getAllowanceArgs(poolContract);
    }
    if (activeFeeFlow === "delegate") {
      return getDelegateArgs(totalAmountMicroStx);
    }
    return [];
  }, [activeFeeFlow, poolContract, totalAmountMicroStx]);

  const functionName =
    activeFeeFlow === "approve" ? "allow-contract-caller" : "delegate-stx";

  const { data: estimations = [], isLoading: isLoadingFees } = useFeeEstimation(
    {
      contractAddress,
      contractName,
      functionName,
      functionArgs: feeEstimationArgs,
      network: selectedNetwork,
      enabled: !!activeFeeFlow,
    },
  );

  const feeMicroStx = useMemo(() => {
    if (selectedFeeOption === "custom") {
      const parsed = parseFloat(customFee) * MICRO_STX;
      return isNaN(parsed) ? undefined : parsed;
    }
    if (estimations.length === 0) return undefined;

    if (selectedFeeOption === "low") return estimations[0]?.fee;
    if (selectedFeeOption === "standard")
      return estimations[1]?.fee ?? estimations[0]?.fee;
    if (selectedFeeOption === "high")
      return estimations[2]?.fee ?? estimations[1]?.fee;

    return estimations[1]?.fee;
  }, [estimations, selectedFeeOption, customFee]);

  const isFeeValid =
    selectedFeeOption !== "custom" && feeMicroStx !== undefined
      ? true
      : selectedFeeOption === "custom" &&
        feeMicroStx !== undefined &&
        feeMicroStx > 0;

  const feeLabel = useMemo(() => {
    if (!feeMicroStx || feeMicroStx <= 0) {
      return selectedFeeOption === "custom" ? "Custom" : "Unknown";
    }
    const label =
      selectedFeeOption === "standard"
        ? "Standard"
        : selectedFeeOption.charAt(0).toUpperCase() +
          selectedFeeOption.slice(1);
    return `${label} (${formatMicroStx(feeMicroStx)} STX)`;
  }, [feeMicroStx, selectedFeeOption]);

  const { isPending: isApprovalPending } = useTrackTx({
    txId: approvalTxId,
    invalidateQueries: [["stacking-allowance"]],
    onSuccess: () => {
      setApprovalTxId(null);
      approvalSheetRef.current?.dismiss();
      setIsProcessing(false);
      setActiveFeeFlow(null);
    },
    onFailure: () => {
      setApprovalTxId(null);
      setIsProcessing(false);
    },
  });

  const { isPending: isDelegatePending } = useTrackTx({
    txId: delegateTxId,
    invalidateQueries: [["stacking-status"], ["stacking-allowance"]],
    onSuccess: () => {
      // Save stacking data to backend after successful delegation
      if (delegateTxId) {
        saveStackingData.mutate({
          txId: delegateTxId,
          poolName: "Fast Pool",
        });
      }
      setDelegateTxId(null);
      delegateSheetRef.current?.dismiss();
      setIsProcessing(false);
      setActiveFeeFlow(null);
    },
    onFailure: () => {
      setDelegateTxId(null);
      setIsProcessing(false);
    },
  });

  const handleConfirmApproval = async () => {
    setIsProcessing(true);
    try {
      const txId = await approveAsync(feeMicroStx ?? undefined);
      setApprovalTxId(txId);
    } catch (error) {
      console.error("Failed to approve pool:", error);
      setIsProcessing(false);
    }
  };

  const handleConfirmDelegate = async () => {
    if (pendingAmount === undefined || pendingAmount <= 0) return;

    setIsProcessing(true);
    try {
      const amountMicroStx = Math.floor(totalStackingAmount * MICRO_STX);
      const txId = await delegateAsync({
        amount: amountMicroStx,
        fee: feeMicroStx ?? undefined,
      });
      setDelegateTxId(txId);
    } catch (error) {
      console.error("Failed to delegate:", error);
      setIsProcessing(false);
    }
  };

  const hasSufficientFunds =
    pendingAmount !== undefined && pendingAmount > 0
      ? pendingAmount <= stxBalance
      : true;

  const handleStackOrIncrease = async () => {
    if (!hasSufficientFunds) {
      setShowTransferSheet(true);
      return;
    }

    if (pendingAmount === undefined || pendingAmount <= 0) return;

    if (!isAllowed) {
      setActiveFeeFlow("approve");
      approvalSheetRef.current?.present();
      return;
    }

    setActiveFeeFlow("delegate");
    delegateSheetRef.current?.present();
  };

  const handleSheetClose = () => {
    setActiveFeeFlow(null);
    approvalSheetRef.current?.dismiss();
    delegateSheetRef.current?.dismiss();
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

  const handleRevoke = async () => {
    try {
      await revokeAsync();
    } catch (error) {
      console.error("Failed to revoke delegation:", error);
    }
  };

  const poolState = {
    stxBalance,
    activePosition,
    stackingInfo,
    isMainnet,
    selectedNetwork,
    isLoadingPool,
    poolContract,
  };

  const formState = {
    hasChanges,
    isValidUpdate,
    pendingAmount,
    hasSufficientFunds,
    calculate,
  };

  const feeState = {
    feeLabel,
    selectedFeeOption,
    customFee,
    isFeeValid,
    isLoadingFees,
    feeMicroStx,
  };

  const uiState = {
    showPoolOptions,
    showTransferSheet,
    isProcessing: isProcessing || isDelegatePending,
    isApprovalPending,
    isDelegatePending,
    approvalSheetRef,
    delegateSheetRef,
  };

  const actions = {
    onUpdateChange: handleCalculatorUpdate,
    onStackOrIncrease: handleStackOrIncrease,
    onConfirmApproval: handleConfirmApproval,
    onConfirmDelegate: handleConfirmDelegate,
    onSheetClose: handleSheetClose,
    onSelectFee: setSelectedFeeOption,
    onCustomFeeChange: setCustomFee,
    setShowPoolOptions,
    setShowTransferSheet,
    onRevoke: handleRevoke,
  };

  return (
    <StackingScreenLayout
      poolState={poolState}
      formState={formState}
      feeState={feeState}
      uiState={uiState}
      actions={actions}
    />
  );
}
