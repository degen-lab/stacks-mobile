import { useEffect, useMemo, useRef, useState } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { showMessage } from "react-native-flash-message";
import {
  usePoxData,
  useTxById,
  useUserBalances,
} from "@/api/stacks/use-stacks-api";
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
import { getFastPoolPositionState } from "../utils/fast-pool-position";
import { getStackingAmountState } from "../utils/stacking-amounts";

export function StackingScreen() {
  const { stackingInfo, daysPerCycle, calculate } = useStacking();
  const {
    balance: stxBalance,
    availableBalance: availableStxBalance,
    lockedBalance,
    burnchainUnlockHeight,
  } = useStxBalance();
  const { data: poxInfo } = usePoxData();
  const { stxAddress: address } = useWalletAddresses();
  const { data: userBalances } = useUserBalances({
    variables: { address: address ?? "" },
    enabled: Boolean(address),
  });
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
    invalidateFastPoolState,
    approvePoolSponsored,
    delegateStxSponsored,
    revokeDelegation,
    revokeDelegationSponsored,
    disallowPoolPermission,
    disallowPoolPermissionSponsored,
  } = useFastPoolActions(address ?? undefined);
  const currentLockTxId = userBalances?.stx.lock_tx_id || null;
  const { data: currentLockTx } = useTxById({
    variables: { txId: currentLockTxId ?? "" },
    enabled: Boolean(
      currentLockTxId && lockedBalance > 0 && !poolStatus?.isLocked,
    ),
  });

  const isStacking = poolStatus?.isLocked ?? false;
  const { currentLockIsFastPool, activePosition } = useMemo(
    () =>
      getFastPoolPositionState({
        currentLockTx,
        poolContract,
        isStacking,
        lockedBalance,
        userStackingData,
      }),
    [currentLockTx, isStacking, lockedBalance, poolContract, userStackingData],
  );

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
  const [sponsoredDelegateRequestId, setSponsoredDelegateRequestId] = useState<
    number | null
  >(null);
  const [hasBroadcastedSponsoredApproval, setHasBroadcastedSponsoredApproval] =
    useState(false);
  const [sponsoredApprovalNextNonce, setSponsoredApprovalNextNonce] = useState<
    number | undefined
  >(undefined);
  const [
    sponsoredApprovalDependencyRequestId,
    setSponsoredApprovalDependencyRequestId,
  ] = useState<number | undefined>(undefined);
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

  const {
    delegateAmountMicroStx,
    delegateAmountStx,
    minimumRequiredLockedAmountLabel,
    calculatorMinimumAmountStx,
    maxLockableAmountStx,
    availableToAddAmountStx,
    isDecreaseBlocked,
    isAlreadyStackedForNextCycle,
    requiresAdditionalFundsForIncrease,
    blockedStackingReason,
    hasSufficientFunds,
  } = useMemo(
    () =>
      getStackingAmountState({
        activePosition,
        pendingAmount,
        stxBalance,
        availableStxBalance,
        burnchainUnlockHeight,
        nextCycleRewardPhaseStartBurnHeight:
          poxInfo?.next_cycle.reward_phase_start_block_height,
        hasChanges,
      }),
    [
      activePosition,
      availableStxBalance,
      burnchainUnlockHeight,
      hasChanges,
      pendingAmount,
      poxInfo?.next_cycle.reward_phase_start_block_height,
      stxBalance,
    ],
  );

  const feeEstimationArgs = useMemo(() => {
    if (activeFeeFlow === "approve") {
      return getAllowanceArgs(poolContract);
    }
    if (activeFeeFlow === "delegate") {
      return getDelegateArgs(delegateAmountMicroStx);
    }
    return [];
  }, [activeFeeFlow, delegateAmountMicroStx, poolContract]);

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

  const resolvedFeeMicroStx = useMemo(() => {
    if (selectedFeeOption === "custom") {
      const parsed = parseFloat(customFee) * MICRO_STX;
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    if (estimations.length === 0) return undefined;

    if (selectedFeeOption === "low") return estimations[0]?.fee;
    if (selectedFeeOption === "standard")
      return estimations[1]?.fee ?? estimations[0]?.fee;
    if (selectedFeeOption === "high")
      return estimations[2]?.fee ?? estimations[1]?.fee;

    return estimations[1]?.fee;
  }, [customFee, estimations, selectedFeeOption]);

  const approvalFeeMicroStx =
    activeFeeFlow === "approve" ? resolvedFeeMicroStx : undefined;
  const delegateFeeMicroStx =
    activeFeeFlow === "delegate" ? resolvedFeeMicroStx : undefined;

  const isSelectedFeeValid = (
    selectedOption: FeeOption,
    feeMicroStx?: number,
  ) => {
    if (selectedOption !== "custom") {
      return feeMicroStx !== undefined;
    }

    return feeMicroStx !== undefined && feeMicroStx > 0;
  };

  const isApprovalFeeValid =
    activeFeeFlow === "approve"
      ? isSelectedFeeValid(selectedFeeOption, approvalFeeMicroStx)
      : false;
  const isDelegateFeeValid =
    activeFeeFlow === "delegate"
      ? isSelectedFeeValid(selectedFeeOption, delegateFeeMicroStx)
      : false;

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
    onComplete: ({ requestId, originNonce }) => {
      setSponsoredApprovalRequestId(null);
      setHasBroadcastedSponsoredApproval(true);
      setSponsoredApprovalDependencyRequestId(requestId);
      setSponsoredApprovalNextNonce(
        originNonce != null ? originNonce + 1 : undefined,
      );
    },
    onFailed: () => {
      setSponsoredApprovalRequestId(null);
      setHasBroadcastedSponsoredApproval(false);
      setSponsoredApprovalDependencyRequestId(undefined);
      setSponsoredApprovalNextNonce(undefined);
      setActiveFeeFlow(null);
      delegateSheetRef.current?.dismiss();
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
      setSponsoredApprovalDependencyRequestId(undefined);
      setSponsoredApprovalNextNonce(undefined);
      setActiveFeeFlow(null);
      delegateSheetRef.current?.dismiss();
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
  const {
    isBroadcasting: isSponsoredDelegateBroadcasting,
    loadingCopy: sponsoredDelegateLoadingCopy,
  } = useSponsoredRequestFlow({
    requestId: sponsoredDelegateRequestId,
    completeOn: ["success"],
    copy: {
      verifying: {
        title: "Verifying delegation...",
        message:
          "Waiting for ad verification before your delegation can be broadcast.",
      },
      queued: {
        title: "Delegation queued...",
        message:
          "Your sponsored delegation is queued and will be broadcast shortly.",
      },
      blocked: {
        title: "Waiting for previous transaction...",
        message:
          "Another sponsored transaction from this wallet is still pending. Delegation will continue once that transaction confirms.",
      },
      confirming: {
        title: "Delegation pending...",
        message:
          "Your sponsored delegation is on chain. Waiting for confirmation.",
      },
      preparing: {
        title: "Preparing delegation...",
        message:
          "Please wait while we finalize your sponsored delegation request.",
      },
    },
    onComplete: ({ txId: broadcastedTxId }) => {
      invalidateFastPoolState();
      if (broadcastedTxId) {
        saveStackingData.mutate({
          txId: broadcastedTxId,
          poolName: "Fast Pool",
        });
      }
      setSponsoredDelegateRequestId(null);
      setActiveFeeFlow(null);
      showMessage({
        message: isStacking ? "Stacking updated" : "Stacking confirmed",
        description: isStacking
          ? "Your updated STX amount is now delegated to Fast Pool."
          : "Your STX is now delegated to Fast Pool.",
        type: "success",
      });
    },
    onFailed: () => {
      setSponsoredDelegateRequestId(null);
      setActiveFeeFlow(null);
      showMessage({
        message: "Delegation failed",
        description:
          "The sponsored delegation did not confirm. Please try again.",
        type: "danger",
      });
    },
    onStatusUnavailable: ({ error }) => {
      setSponsoredDelegateRequestId(null);
      setActiveFeeFlow(null);
      showMessage({
        message: "Delegation status unavailable",
        description:
          error instanceof Error
            ? error.message
            : "We couldn't confirm the sponsored delegation status.",
        type: "danger",
      });
      console.error("Sponsored delegation status unavailable:", error);
    },
  });
  const hasPoolApproval = Boolean(isAllowed) || hasBroadcastedSponsoredApproval;

  useEffect(() => {
    if (!isAllowed) return;
    setHasBroadcastedSponsoredApproval(false);
    setSponsoredApprovalDependencyRequestId(undefined);
    setSponsoredApprovalNextNonce(undefined);
  }, [isAllowed]);

  useEffect(() => {
    if (!currentLockTxId || !currentLockIsFastPool) return;
    if (!userProfile?.id || isUserStackingDataLoading) return;
    if (userStackingData.length > 0 || saveStackingData.isPending) return;
    if (recoveredHistoryTxIdRef.current === currentLockTxId) return;

    recoveredHistoryTxIdRef.current = currentLockTxId;
    void saveStackingData
      .mutateAsync({
        txId: currentLockTxId,
        poolName: "Fast Pool",
      })
      .catch(() => {
        recoveredHistoryTxIdRef.current = null;
      });
  }, [
    currentLockIsFastPool,
    currentLockTxId,
    isUserStackingDataLoading,
    saveStackingData,
    userProfile?.id,
    userStackingData.length,
  ]);

  const showBlockedStackingMessage = () => {
    if (!blockedStackingReason) return false;

    showMessage({
      message: isDecreaseBlocked
        ? "Cannot decrease locked amount"
        : "Already stacked for next cycle",
      description: blockedStackingReason,
      type: "danger",
    });
    return true;
  };

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
      const txId = await approveAsync(approvalFeeMicroStx);
      setApprovalTxId(txId);
    } catch (error) {
      console.error("Failed to approve pool:", error);
      setIsProcessing(false);
    }
  };

  const handleSponsoredApproval = async () => {
    try {
      const requestId = await approvePoolSponsored(approvalFeeMicroStx);

      setSponsoredApprovalRequestId(requestId);
      setHasBroadcastedSponsoredApproval(false);
      if (pendingAmount !== undefined && pendingAmount > 0) {
        pendingSheetTransitionRef.current = "delegate";
      }
      approvalSheetRef.current?.dismiss();
    } catch (error) {
      console.error("Failed to sponsor pool approval:", error);
    }
  };

  const handleConfirmDelegate = async () => {
    if (pendingAmount === undefined || pendingAmount <= 0) return;
    if (showBlockedStackingMessage()) return;

    setIsProcessing(true);
    try {
      const txId = await delegateAsync({
        amount: delegateAmountMicroStx,
        fee: delegateFeeMicroStx,
      });
      setDelegateTxId(txId);
    } catch (error) {
      console.error("Failed to delegate:", error);
      setIsProcessing(false);
    }
  };

  const handleSponsoredDelegate = async () => {
    if (pendingAmount === undefined || pendingAmount <= 0) return;
    if (showBlockedStackingMessage()) return;

    try {
      const requestId = await delegateStxSponsored(
        delegateAmountMicroStx,
        delegateFeeMicroStx,
        sponsoredApprovalNextNonce,
        sponsoredApprovalDependencyRequestId,
      );

      setSponsoredDelegateRequestId(requestId);
      delegateSheetRef.current?.dismiss();
    } catch (error) {
      console.error("Failed to sponsor delegation:", error);
    }
  };

  const handleStackOrIncrease = async () => {
    if (requiresAdditionalFundsForIncrease) {
      setGetAssetSheetOpen(true);
      return;
    }

    if (showBlockedStackingMessage()) {
      return;
    }

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
    hasPoolApproval,
    activePosition,
    stackingInfo,
    daysPerCycle,
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
  };

  const feeState = {
    selectedFeeOption,
    customFee,
    isApprovalFeeValid,
    isDelegateFeeValid,
    isLoadingFees,
    approvalFeeMicroStx,
    delegateFeeMicroStx,
  };

  const uiState = {
    showPoolOptions,
    isProcessing:
      isProcessing || isDelegatePending || isRevoking || isDisallowing,
    isSponsoredSubmitting: isSubmittingSponsored,
    isSponsoredApprovalBroadcasting,
    isSponsoredDelegateBroadcasting,
    sponsoredApprovalLoadingCopy,
    sponsoredDelegateLoadingCopy,
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
