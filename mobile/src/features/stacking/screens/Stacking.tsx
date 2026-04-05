import { useEffect, useMemo, useRef, useState } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { showMessage } from "react-native-flash-message";
import { useTransactions } from "@/api/stacks/use-stacks-api";
import { MICRO_STX } from "@/lib/format/currency";
import { useStacking } from "../hooks/use-stacking";
import {
  getAllowanceArgs,
  getDelegateArgs,
} from "@/api/stacks/fast-pool/fast-pool";
import { useTrackTx } from "../hooks/use-track-tx";
import { useFeeEstimation } from "@/api/stacks/use-fee";
import { FeeOption } from "../components/fee-selector";
import { LeavePoolSheet } from "../components/leave-pool-sheet";
import { GetAssetSheet } from "@/features/transfer/components/get-asset-sheet";
import { StackingScreenLayout } from "./Stacking.layout";
import { useStxBalance } from "@/hooks/use-stx-balance";
import {
  useSaveStackingDataMutation,
  useUserStackingData,
} from "@/api/stacking";
import { useTransferSheet } from "@/features/transfer";
import { useTransak } from "@/features/transak/context/transak-context";
import { useUserProfile } from "@/api/user";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useSelectedNetwork } from "@/lib/store/settings";
import { useFastPoolActions } from "../hooks/use-fast-pool-actions";
import { useSponsoredRequestFlow } from "../hooks/use-sponsored-request-flow";

type AddressTransactionSummary = {
  txId: string;
  txStatus: string;
  senderAddress?: string;
  contractCall?: {
    functionName?: string;
    contractId?: string;
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getString = (
  value: Record<string, unknown>,
  key: string,
): string | undefined => {
  const candidate = value[key];
  return typeof candidate === "string" ? candidate : undefined;
};

const parseAddressTransaction = (
  value: unknown,
): AddressTransactionSummary | null => {
  if (!isRecord(value)) return null;

  const txRecord =
    value.tx && isRecord(value.tx)
      ? value.tx
      : (value as Record<string, unknown>);
  const txId = getString(txRecord, "tx_id");
  if (!txId) return null;

  const contractCall = txRecord.contract_call;
  const contractCallRecord = isRecord(contractCall) ? contractCall : null;

  return {
    txId,
    txStatus: getString(txRecord, "tx_status") ?? "",
    senderAddress: getString(txRecord, "sender_address"),
    contractCall: contractCallRecord
      ? {
          functionName: getString(contractCallRecord, "function_name"),
          contractId: getString(contractCallRecord, "contract_id"),
        }
      : undefined,
  };
};

const findLatestFastPoolDelegateTxId = (
  response: unknown,
  address: string,
  poolContract: string,
): string | null => {
  if (!isRecord(response)) return null;
  const results = response.results;
  if (!Array.isArray(results)) return null;

  for (const result of results) {
    const transaction = parseAddressTransaction(result);
    if (!transaction) continue;
    if (transaction.senderAddress !== address) continue;
    if (transaction.contractCall?.functionName !== "delegate-stx") continue;
    if (transaction.contractCall?.contractId !== poolContract) continue;
    if (
      transaction.txStatus !== "pending" &&
      transaction.txStatus !== "success"
    ) {
      continue;
    }
    return transaction.txId;
  }

  return null;
};

export function StackingScreen() {
  const { stackingInfo, daysPerCycle, calculate } = useStacking();
  const {
    balance: stxBalance,
    availableBalance: availableStxBalance,
    lockedBalance,
  } = useStxBalance();
  const { stxAddress: address } = useWalletAddresses();
  const { data: userProfile } = useUserProfile();
  const {
    data: userStackingData = [],
    isLoading: isUserStackingDataLoading,
    isError: isUserStackingDataError,
  } = useUserStackingData({
    variables: { userId: userProfile?.id ?? 0 },
    enabled: !!userProfile?.id,
  });
  const { selectedNetwork } = useSelectedNetwork();
  const { openTransfer } = useTransferSheet();
  const { openTransak } = useTransak();
  const [getAssetSheetOpen, setGetAssetSheetOpen] = useState(false);
  const [isLeavePoolOpen, setIsLeavePoolOpen] = useState(false);

  const approvalSheetRef = useRef<BottomSheetModal>(null);
  const delegateSheetRef = useRef<BottomSheetModal>(null);
  const pendingSheetTransitionRef = useRef<"delegate" | null>(null);

  const {
    status: poolStatus,
    isLoading: isLoadingPool,
    isAllowed,
    approveAsync,
    delegateAsync,
    isRevoking,
    isDisallowing,
    poolContract,
    poxContract,
    isSubmittingSponsored,
    approvePoolSponsored,
    delegateStxSponsored,
    revokeDelegation,
    revokeDelegationSponsored,
    disallowPoolPermission,
    disallowPoolPermissionSponsored,
  } = useFastPoolActions(address ?? undefined);

  const isStacking = poolStatus?.isLocked ?? false;
  const totalRewardedStx = useMemo(
    () =>
      userStackingData.reduce(
        (total, delegation) =>
          total + Number(delegation.rewardedStxAmount ?? 0),
        0,
      ),
    [userStackingData],
  );
  const hasTrackedRewards = useMemo(
    () =>
      userStackingData.some(
        (delegation) => delegation.rewardedStxAmount != null,
      ),
    [userStackingData],
  );

  const activePosition = isStacking
    ? {
        lockedAmount: lockedBalance,
        lockDuration: 1,
        nextUnlockDays: daysPerCycle,
        status: "ACTIVE" as const,
        poolName: "Fast Pool",
        rewardedStxAmount: hasTrackedRewards ? totalRewardedStx : undefined,
      }
    : undefined;

  const saveStackingData = useSaveStackingDataMutation();
  const recoveredHistoryTxIdRef = useRef<string | null>(null);

  const [hasChanges, setHasChanges] = useState(false);
  const [isValidUpdate, setIsValidUpdate] = useState(false);
  const [showPoolOptions, setShowPoolOptions] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | undefined>(
    undefined,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalTxId, setApprovalTxId] = useState<string | null>(null);
  const [delegateTxId, setDelegateTxId] = useState<string | null>(null);
  const [sponsoredApprovalRequestId, setSponsoredApprovalRequestId] = useState<
    number | null
  >(null);
  const [hasBroadcastedSponsoredApproval, setHasBroadcastedSponsoredApproval] =
    useState(false);
  const [sponsoredApprovalNextNonce, setSponsoredApprovalNextNonce] = useState<
    number | undefined
  >(undefined);
  const [selectedFeeOption, setSelectedFeeOption] =
    useState<FeeOption>("standard");
  const [customFee, setCustomFee] = useState("");

  // Estimation State
  const [activeFeeFlow, setActiveFeeFlow] = useState<
    "approve" | "delegate" | null
  >(null);

  const isMainnet = selectedNetwork === "mainnet";
  const feeEstimationContractId =
    activeFeeFlow === "approve" ? poxContract : poolContract;
  const [contractAddress, contractName] = feeEstimationContractId.split(".");

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

  const shouldRecoverStackingHistory =
    Boolean(address) &&
    Boolean(userProfile?.id) &&
    isStacking &&
    !isUserStackingDataLoading &&
    userStackingData.length === 0 &&
    !saveStackingData.isPending;

  const { data: recentAddressTransactions } = useTransactions({
    variables: { address: address ?? "" },
    enabled: shouldRecoverStackingHistory,
  });

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

  const {
    isBroadcasting: isSponsoredApprovalBroadcasting,
    loadingCopy: sponsoredApprovalLoadingCopy,
  } = useSponsoredRequestFlow({
    requestId: sponsoredApprovalRequestId,
    completeOn: ["pending", "success"],
    copy: {
      verifying: {
        title: "Verifying sponsorship...",
        message:
          "Waiting for ad verification before your approval can be broadcast.",
      },
      queued: {
        title: "Approval queued...",
        message:
          "Your sponsored approval is queued and will be broadcast shortly.",
      },
      blocked: {
        title: "Waiting for previous transaction...",
        message:
          "Another sponsored transaction from this wallet is still pending. Approval will continue once that transaction confirms.",
      },
      confirming: {
        title: "Approval pending...",
        message:
          "Your sponsored approval is on chain. Waiting for confirmation before you can continue.",
      },
      preparing: {
        title: "Preparing approval...",
        message:
          "Please wait while we finalize your sponsored approval request.",
      },
    },
    onComplete: ({ originNonce }) => {
      setSponsoredApprovalRequestId(null);
      setHasBroadcastedSponsoredApproval(true);
      setSponsoredApprovalNextNonce(
        originNonce != null ? originNonce + 1 : undefined,
      );
      showMessage({
        message: "Approval confirmed",
        description: "You can now continue to stack your STX.",
        type: "success",
      });

      if (pendingAmount !== undefined && pendingAmount > 0) {
        setActiveFeeFlow("delegate");
        requestAnimationFrame(() => {
          delegateSheetRef.current?.present();
        });
      }
    },
    onFailed: () => {
      setSponsoredApprovalRequestId(null);
      setHasBroadcastedSponsoredApproval(false);
      setSponsoredApprovalNextNonce(undefined);
      setActiveFeeFlow(null);
      showMessage({
        message: "Approval failed",
        description:
          "The sponsored approval could not be broadcast. Please try again.",
        type: "danger",
      });
    },
    onStatusUnavailable: ({ error }) => {
      setSponsoredApprovalRequestId(null);
      setHasBroadcastedSponsoredApproval(false);
      setSponsoredApprovalNextNonce(undefined);
      setActiveFeeFlow(null);
      showMessage({
        message: "Approval status unavailable",
        description:
          error instanceof Error
            ? error.message
            : "We couldn't confirm the sponsored approval status.",
        type: "danger",
      });
    },
  });
  const hasPoolApproval = Boolean(isAllowed) || hasBroadcastedSponsoredApproval;

  useEffect(() => {
    if (!isAllowed) return;
    setHasBroadcastedSponsoredApproval(false);
    setSponsoredApprovalNextNonce(undefined);
  }, [isAllowed]);

  useEffect(() => {
    if (!shouldRecoverStackingHistory || !address) return;

    const recoveredTxId = findLatestFastPoolDelegateTxId(
      recentAddressTransactions,
      address,
      poolContract,
    );
    if (!recoveredTxId) return;
    if (recoveredHistoryTxIdRef.current === recoveredTxId) return;

    recoveredHistoryTxIdRef.current = recoveredTxId;
    void saveStackingData.mutateAsync({
      txId: recoveredTxId,
      poolName: "Fast Pool",
    });
  }, [
    address,
    poolContract,
    recentAddressTransactions,
    saveStackingData,
    shouldRecoverStackingHistory,
  ]);

  const { isPending: isApprovalPending } = useTrackTx({
    txId: approvalTxId,
    invalidateQueries: [["stacking-allowance"], ["stacks-user-balances"]],
    onSuccess: () => {
      setApprovalTxId(null);
      setIsProcessing(false);
      showMessage({
        message: "Approval confirmed",
        description: "Fast Pool can now manage your stacking rights.",
        type: "success",
      });
      if (pendingAmount === undefined || pendingAmount <= 0) {
        setActiveFeeFlow(null);
        approvalSheetRef.current?.dismiss();
        return;
      }

      pendingSheetTransitionRef.current = "delegate";
      approvalSheetRef.current?.dismiss();
    },
    onFailure: () => {
      setApprovalTxId(null);
      setIsProcessing(false);
    },
  });

  const { isPending: isDelegatePending } = useTrackTx({
    txId: delegateTxId,
    invalidateQueries: [
      ["stacking-status"],
      ["stacking-allowance"],
      ["stacks-user-balances"],
      ["stacking-user-data"],
    ],
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
      showMessage({
        message: isStacking ? "Stacking updated" : "Stacking confirmed",
        description: isStacking
          ? "Your updated STX amount is now delegated to Fast Pool."
          : "Your STX is now delegated to Fast Pool.",
        type: "success",
      });
    },
    onFailure: () => {
      setDelegateTxId(null);
      setIsProcessing(false);
    },
  });

  const handleConfirmApproval = async () => {
    setIsProcessing(true);
    try {
      const txId = await approveAsync(feeMicroStx);
      setApprovalTxId(txId);
    } catch (error) {
      console.error("Failed to approve pool:", error);
      setIsProcessing(false);
    }
  };

  const handleSponsoredApproval = async () => {
    try {
      const requestId = await approvePoolSponsored(feeMicroStx);

      setSponsoredApprovalRequestId(requestId);
      setHasBroadcastedSponsoredApproval(false);
      approvalSheetRef.current?.dismiss();
      showMessage({
        message: "Approval queued",
        description: "Your sponsored approval will be broadcast shortly.",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to sponsor pool approval:", error);
    }
  };

  const handleConfirmDelegate = async () => {
    if (pendingAmount === undefined || pendingAmount <= 0) return;

    setIsProcessing(true);
    try {
      const amountMicroStx = Math.floor(totalStackingAmount * MICRO_STX);
      const txId = await delegateAsync({
        amount: amountMicroStx,
        fee: feeMicroStx,
      });
      setDelegateTxId(txId);
    } catch (error) {
      console.error("Failed to delegate:", error);
      setIsProcessing(false);
    }
  };

  const handleSponsoredDelegate = async () => {
    if (pendingAmount === undefined || pendingAmount <= 0) return;

    try {
      const amountMicroStx = Math.floor(totalStackingAmount * MICRO_STX);
      await delegateStxSponsored(amountMicroStx, feeMicroStx, sponsoredApprovalNextNonce);

      delegateSheetRef.current?.dismiss();
      setActiveFeeFlow(null);
      showMessage({
        message: "Delegation queued",
        description: "Your sponsored delegation will be broadcast shortly.",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to sponsor delegation:", error);
    }
  };

  const hasSufficientFunds =
    pendingAmount !== undefined && pendingAmount > 0
      ? pendingAmount <= stxBalance
      : true;

  const handleStackOrIncrease = async () => {
    if (!hasSufficientFunds) {
      setGetAssetSheetOpen(true);
      return;
    }

    if (isSponsoredApprovalBroadcasting) return;
    if (pendingAmount === undefined || pendingAmount <= 0) return;

    if (!hasPoolApproval) {
      setActiveFeeFlow("approve");
      approvalSheetRef.current?.present();
      return;
    }

    setActiveFeeFlow("delegate");
    delegateSheetRef.current?.present();
  };

  const handleSheetClose = () => {
    if (pendingSheetTransitionRef.current === "delegate") {
      pendingSheetTransitionRef.current = null;
      setActiveFeeFlow("delegate");
      requestAnimationFrame(() => {
        delegateSheetRef.current?.present();
      });
      return;
    }

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

  const handleOpenLeavePool = () => {
    setShowPoolOptions(false);
    setIsLeavePoolOpen(true);
  };

  const handleRevoke = async (leaveFeeMicroStx?: number) => {
    return revokeDelegation(leaveFeeMicroStx);
  };

  const handleSponsoredRevoke = async (leaveFeeMicroStx?: number) => {
    return revokeDelegationSponsored(leaveFeeMicroStx);
  };

  const handleDisallow = async (leaveFeeMicroStx?: number) => {
    return disallowPoolPermission(leaveFeeMicroStx);
  };

  const handleSponsoredDisallow = async (leaveFeeMicroStx?: number) => {
    return disallowPoolPermissionSponsored(leaveFeeMicroStx);
  };

  const poolState = {
    availableStxBalance,
    activePosition,
    stackingInfo,
    isMainnet,
    selectedNetwork,
    isLoadingPool,
    poolContract,
    poxContract,
  };

  const formState = {
    hasChanges,
    isValidUpdate,
    pendingAmount,
    hasSufficientFunds,
    calculate,
  };

  const feeState = {
    selectedFeeOption,
    customFee,
    isFeeValid,
    isLoadingFees,
    feeMicroStx,
  };

  const uiState = {
    showPoolOptions,
    isProcessing:
      isProcessing || isDelegatePending || isRevoking || isDisallowing,
    isSponsoredSubmitting: isSubmittingSponsored,
    isSponsoredApprovalBroadcasting,
    sponsoredApprovalLoadingCopy,
    isApprovalPending,
    isDelegatePending,
    approvalSheetRef,
    delegateSheetRef,
  };

  const actions = {
    onUpdateChange: handleCalculatorUpdate,
    onStackOrIncrease: handleStackOrIncrease,
    onConfirmApproval: handleConfirmApproval,
    onConfirmSponsoredApproval: handleSponsoredApproval,
    onConfirmDelegate: handleConfirmDelegate,
    onConfirmSponsoredDelegate: handleSponsoredDelegate,
    onSheetClose: handleSheetClose,
    onSelectFee: setSelectedFeeOption,
    onCustomFeeChange: setCustomFee,
    setShowPoolOptions,
    onLeavePool: handleOpenLeavePool,
  };

  const stackingHistory = {
    delegations: userStackingData,
    isLoading: isUserStackingDataLoading,
    isError: isUserStackingDataError,
  };

  return (
    <>
      <StackingScreenLayout
        poolState={poolState}
        formState={formState}
        feeState={feeState}
        uiState={uiState}
        actions={actions}
        stackingHistory={stackingHistory}
      />
      <GetAssetSheet
        open={getAssetSheetOpen}
        asset="STX"
        onClose={() => setGetAssetSheetOpen(false)}
        onBuy={() => openTransak("STX", "buy")}
        onReceive={() =>
          openTransfer({ mode: "receive", receive: { asset: "STX" } })
        }
      />
      <LeavePoolSheet
        open={isLeavePoolOpen}
        onOpenChange={setIsLeavePoolOpen}
        network={selectedNetwork}
        poolContract={poolContract}
        poxContract={poxContract}
        isStacking={isStacking}
        isAllowed={Boolean(isAllowed)}
        onRevoke={handleRevoke}
        onSponsoredRevoke={handleSponsoredRevoke}
        onDisallow={handleDisallow}
        onSponsoredDisallow={handleSponsoredDisallow}
      />
    </>
  );
}
