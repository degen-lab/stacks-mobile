import { useEffect, useMemo, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { useQueryClient } from "@tanstack/react-query";

import { EarnBtcLayout } from "./EarnBtc.layout";
import { buildEarnBtcSteps } from "./model";
import { BitcoinTree } from "@/components/icons/BitcoinTree";
import { EnrollRewardsSheet } from "../layout/modals/enroll-rewards-sheet";
import { MintSbtcSheet } from "../layout/modals/mint-sbtc-sheet";
import { StackingPoolSheet } from "../layout/modals/stacking-pool-sheet";
import { TermsAndConditionsSheet } from "../layout/modals/terms-and-conditions-sheet";
import { TransactionStatusSheet } from "../layout/modals/transaction-status-sheet";
import { useContractCallFee } from "@/hooks/use-contract-call-fee";
import {
  useTrackEnrollTx,
  invalidateEnrollmentQueries,
  optimisticSetEnrolled,
} from "@/features/dual-stacking/hooks/use-track-enroll-tx";
import { useSponsoredRequestFlow } from "@/features/stacking/hooks/use-sponsored-request-flow";
import { useEnrollmentStatus } from "@/features/dual-stacking/hooks/use-enrollment-status";
import { useAprComputation } from "@/features/dual-stacking/hooks/use-apr-computation";
import { useMeetsMinimumEnrollmentAmount } from "@/api/dual-stacking/contract/hooks";
import { useCheckTerms } from "@/api/dual-stacking/enrollment/use-check-terms";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { useSponsoredStacksTransaction } from "@/hooks/use-sponsored-stacks-transaction";
import { contractEnroll } from "../../contract-calls/enroll";
import { getActiveWalletAccount } from "@/lib/stacks/active-account";
import type { TransactionMethod } from "@/lib/enums";
import { buildUnsignedContractCall } from "@/lib/stacks/transaction-builder";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { getExplorerTxUrl } from "@/lib/stacks/network";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";
import { useSelectedNetwork } from "@/lib/store/settings";
import { noneCV, PostConditionMode } from "@stacks/transactions";

type EarnBtcContainerProps = {
  onExploreApps?: () => void;
};

export default function EarnBtcContainer({
  onExploreApps,
}: EarnBtcContainerProps) {
  const queryClient = useQueryClient();
  const { stxAddress } = useWalletAddresses();
  const { selectedNetwork } = useSelectedNetwork();
  const { submitSponsoredTransaction, isSubmittingSponsored } =
    useSponsoredStacksTransaction();
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);
  const [enrollTxId, setEnrollTxId] = useState<string | null>(null);
  const [enrollSponsoredRequestId, setEnrollSponsoredRequestId] = useState<
    number | null
  >(null);
  const [enrollFunding, setEnrollFunding] = useState<TransactionMethod | null>(
    null,
  );

  const [isEnrollSheetOpen, setIsEnrollSheetOpen] = useState(false);
  const [isMintSbtcSheetOpen, setIsMintSbtcSheetOpen] = useState(false);
  const [isStackingPoolSheetOpen, setIsStackingPoolSheetOpen] = useState(false);
  const [isTermsSheetOpen, setIsTermsSheetOpen] = useState(false);
  const [isEnrolledModalOpen, setIsEnrolledModalOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const {
    enrolledNextCycle,
    isLoading: isEnrollmentLoading,
    isError: isEnrollmentError,
  } = useEnrollmentStatus();

  const {
    sbtcBalance: sbtcBalanceSats,
    totalSbtcDefi: totalSbtcDefiSats,
    isLoading: isComputationLoading,
    isError: isComputationError,
  } = useAprComputation();

  const {
    data: meetsMinimumEnrollAmount,
    isLoading: isMinEnrollLoading,
    isError: isMinEnrollError,
  } = useMeetsMinimumEnrollmentAmount(stxAddress);

  const {
    balance: stxTotalBalance,
    lockedBalance: stxStacked,
    isLoading: isStxBalanceLoading,
  } = useStxBalance();

  const { data: hasAcceptedTerms } = useCheckTerms({
    variables: { address: stxAddress ?? "" },
    enabled: !!stxAddress,
  });

  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const contractId = CONTRACTS[selectedNetwork][contractType];
  const enrollFunctionName = SC_FUNCTIONS[contractType].publicFunctions.ENROLL;
  const enrollFunctionArgs = [noneCV()];

  const {
    selectedFeeOption,
    setSelectedFeeOption,
    customFee,
    setCustomFee,
    feeMicroStx,
    isFeeValid,
    isLoadingFees,
  } = useContractCallFee({
    contractId,
    functionName: enrollFunctionName,
    functionArgs: enrollFunctionArgs,
    enabled: isEnrollSheetOpen,
  });

  const isLoading =
    isEnrollmentLoading ||
    isComputationLoading ||
    isMinEnrollLoading ||
    isStxBalanceLoading;

  const isError = isEnrollmentError || isComputationError || isMinEnrollError;

  const stackingPercentage =
    stxTotalBalance > 0 ? stxStacked / stxTotalBalance : 0;
  const isStacking = stackingPercentage >= 0.2;

  const totalSbtcSats = sbtcBalanceSats + totalSbtcDefiSats;
  const defiPercentage =
    totalSbtcSats > 0 ? totalSbtcDefiSats / totalSbtcSats : 0;
  const isDeFiParticipant = defiPercentage >= 0.5;

  const enrollExplorerUrl = enrollTxId
    ? getExplorerTxUrl(enrollTxId).explorerUrl
    : undefined;

  useTrackEnrollTx({
    txId: enrollTxId,
    onSuccess: () => {
      optimisticSetEnrolled(queryClient, { isEnrolledNextCycle: true });
      setIsSubmittingEnroll(false);
      setIsEnrolling(false);
      setEnrollTxId(null);
    },
    onFailure: (_status, repr) => {
      setIsSubmittingEnroll(false);
      setIsEnrolling(false);
      setIsEnrolledModalOpen(false);
      setEnrollTxId(null);
      showMessage({
        message: "Enrollment failed",
        description: repr,
        type: "danger",
      });
    },
  });

  const { loadingCopy: enrollSponsoredLoadingCopy } = useSponsoredRequestFlow({
    requestId: enrollSponsoredRequestId,
    copy: {
      preparing: {
        title: "Preparing enrollment...",
        message:
          "Please wait while we finalize your sponsored enrollment request.",
      },
      verifying: {
        title: "Verifying sponsorship...",
        message:
          "Waiting for ad verification before your enrollment can be broadcast.",
      },
      queued: {
        title: "Enrollment queued...",
        message:
          "Your sponsored enrollment is queued and will be broadcast shortly.",
      },
      blocked: {
        title: "Waiting for previous transaction...",
        message:
          "Another sponsored transaction from this wallet is still pending. Enrollment will continue once that transaction confirms.",
      },
      confirming: {
        title: "Enrollment pending...",
        message:
          "Your sponsored enrollment is on chain. Waiting for confirmation.",
      },
    },
    onComplete: () => {
      setEnrollSponsoredRequestId(null);
      setIsEnrolling(false);
      invalidateEnrollmentQueries(queryClient);
      setTimeout(() => {
        invalidateEnrollmentQueries(queryClient);
      }, 15000);
    },
    onFailed: () => {
      setEnrollSponsoredRequestId(null);
      setIsEnrolling(false);
      setIsEnrolledModalOpen(false);
      showMessage({
        message: "Enrollment failed",
        description:
          "The sponsored enrollment could not be broadcast. Please try again.",
        type: "danger",
      });
    },
    onStatusUnavailable: ({ error }) => {
      setEnrollSponsoredRequestId(null);
      setIsEnrolling(false);
      setIsEnrolledModalOpen(false);
      showMessage({
        message: "Enrollment status unavailable",
        description:
          error instanceof Error
            ? error.message
            : "We couldn't confirm the sponsored enrollment status.",
        type: "danger",
      });
    },
  });

  useEffect(() => {
    if (!isEnrolledModalOpen || isEnrolling) return;

    const timeout = setTimeout(() => {
      setIsEnrolledModalOpen(false);
    }, 2200);

    return () => clearTimeout(timeout);
  }, [isEnrolledModalOpen, isEnrolling]);

  const model = useMemo(
    () =>
      buildEarnBtcSteps({
        isEnrolledNextCycle: Boolean(enrolledNextCycle),
        isConnected: Boolean(stxAddress),
        meetsMinimumEnrollAmount: Boolean(meetsMinimumEnrollAmount),
        isStacking,
        isDeFiParticipant,
        hasEnrollMempoolTx: !!enrollTxId,
        enrollExplorerUrl,
      }),
    [
      enrolledNextCycle,
      stxAddress,
      meetsMinimumEnrollAmount,
      isStacking,
      isDeFiParticipant,
      enrollTxId,
      enrollExplorerUrl,
    ],
  );

  const handleOpenEnroll = (opts?: { skipTermsCheck?: boolean }) => {
    if (!stxAddress) return;

    if (!opts?.skipTermsCheck && !hasAcceptedTerms) {
      setIsTermsSheetOpen(true);
      return;
    }

    if (!contractId) {
      showMessage({
        message: "Enrollment unavailable",
        description:
          "Dual Stacking contract is not configured for this network.",
        type: "danger",
      });
      return;
    }

    setIsEnrollSheetOpen(true);
  };

  const handleEnroll = async () => {
    if (!stxAddress || !isFeeValid) return;

    setIsSubmittingEnroll(true);
    try {
      setEnrollFunding("wallet");
      const txid = await contractEnroll(undefined, feeMicroStx);

      setEnrollTxId(txid ?? null);
      setIsEnrolledModalOpen(true);
      setIsEnrolling(true);
      setIsEnrollSheetOpen(false);
    } catch {
      showMessage({
        message: "Enrollment failed",
        description: "Unable to create or broadcast enrollment transaction.",
        type: "danger",
      });
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  const handleSponsoredEnroll = async () => {
    if (!stxAddress || !isFeeValid) return;

    setIsSubmittingEnroll(true);
    try {
      setEnrollFunding("sponsored");
      const { account, accountIndex, address } = await getActiveWalletAccount();
      const unsignedSerializedTx = await buildUnsignedContractCall({
        contractId,
        functionName: enrollFunctionName,
        functionArgs: enrollFunctionArgs,
        network: selectedNetwork,
        publicKey: account.publicKey,
        feeMicroStx,
        postConditionMode: PostConditionMode.Allow,
        sponsored: true,
      });
      const requestId = await submitSponsoredTransaction({
        originAddress: address,
        accountIndex,
        unsignedSerializedTx,
      });

      setEnrollSponsoredRequestId(requestId);
      setIsEnrolledModalOpen(true);
      setIsEnrolling(true);
      setIsEnrollSheetOpen(false);
    } catch {
      showMessage({
        message: "Enrollment failed",
        description: "Unable to queue the sponsored enrollment transaction.",
        type: "danger",
      });
    } finally {
      setIsSubmittingEnroll(false);
    }
  };

  const handleStepAction = (stepId: number) => {
    const step = model.steps.find((s) => s.id === stepId);
    if (!step) return;

    if (stepId === 1) {
      setIsMintSbtcSheetOpen(true);
      return;
    }

    if (stepId === 3) {
      setIsStackingPoolSheetOpen(true);
      return;
    }

    if (stepId === 4) {
      onExploreApps?.();
      return;
    }

    if (step.cta.kind === "link") {
      return;
    }

    switch (stepId) {
      case 2:
        handleOpenEnroll();
        break;
    }
  };

  return (
    <>
      <EarnBtcLayout
        model={model}
        onStepAction={handleStepAction}
        isLoading={isLoading}
        isError={isError}
      />
      <EnrollRewardsSheet
        open={isEnrollSheetOpen}
        onOpenChange={setIsEnrollSheetOpen}
        network={selectedNetwork}
        contractId={contractId}
        functionName={enrollFunctionName}
        selectedFeeOption={selectedFeeOption}
        onSelectFee={setSelectedFeeOption}
        customFee={customFee}
        onCustomFeeChange={setCustomFee}
        isFeeValid={isFeeValid}
        isLoadingFees={isLoadingFees}
        feeMicroStx={feeMicroStx}
        onConfirm={handleEnroll}
        onSponsoredConfirm={handleSponsoredEnroll}
        isSubmitting={isSubmittingEnroll}
        isSponsoredSubmitting={isSubmittingSponsored}
      />
      <MintSbtcSheet
        open={isMintSbtcSheetOpen}
        onOpenChange={setIsMintSbtcSheetOpen}
      />
      <StackingPoolSheet
        open={isStackingPoolSheetOpen}
        onOpenChange={setIsStackingPoolSheetOpen}
      />
      <TermsAndConditionsSheet
        open={isTermsSheetOpen}
        onOpenChange={setIsTermsSheetOpen}
        address={stxAddress ?? ""}
        onAccept={() => handleOpenEnroll({ skipTermsCheck: true })}
      />
      <TransactionStatusSheet
        open={isEnrolledModalOpen}
        onOpenChange={setIsEnrolledModalOpen}
        isLoading={isEnrolling}
        loading={{
          title:
            enrollFunding === "sponsored"
              ? enrollSponsoredLoadingCopy.title
              : "Processing your enrollment...",
          message:
            enrollFunding === "sponsored"
              ? enrollSponsoredLoadingCopy.message
              : "Please wait while we confirm your transaction on the blockchain.",
        }}
        success={{
          title: "Congrats! You are enrolled in Dual Stacking",
          message:
            "Starting next cycle you'll earn Bitcoin-denominated yield, powered by Stacks.",
        }}
      >
        <BitcoinTree width={188} height={88} />
      </TransactionStatusSheet>
    </>
  );
}
