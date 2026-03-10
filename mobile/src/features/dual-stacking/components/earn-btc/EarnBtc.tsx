import { useMemo, useState } from "react";
import { showMessage } from "react-native-flash-message";

import { EarnBtcLayout } from "./EarnBtc.layout";
import { buildEarnBtcSteps } from "./model";
import { EnrollRewardsSheet } from "../layout/EnrollRewardsSheet";
import { MintSbtcSheet } from "../layout/MintSbtcSheet";
import { StackingPoolSheet } from "../layout/StackingPoolSheet";
import { TermsAndConditionsSheet } from "../layout/TermsAndConditionsSheet";
import { TermsDetailsSheet } from "../layout/TermsDetailsSheet";
import { useContractCallFee } from "@/hooks/use-contract-call-fee";
import { useTrackEnrollTx } from "@/features/dual-stacking/hooks/use-track-enroll-tx";
import { useEnrollmentStatus } from "@/features/dual-stacking/hooks/useEnrollmentStatus";
import { useAprComputation } from "@/features/dual-stacking/hooks/useAprComputation";
import { useMinHoldForEnrollment } from "@/api/dual-stacking/contract/hooks";
import { useCheckTerms } from "@/api/dual-stacking/enrollment/use-check-terms";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { fromSatsToBtc } from "@/lib/format/currency";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { walletKit } from "@/lib/stacks/wallet";
import { getExplorerTxUrl } from "@/lib/stacks/network";
import { useSelectedNetwork, useSettingsStore } from "@/lib/store/settings";
import { PostConditionMode } from "@stacks/transactions";
import { TransactionLoadingOverlay } from "@/components/transaction-loading-overlay";

type EarnBtcContainerProps = {
  onExploreApps?: () => void;
};

export default function EarnBtcContainer({
  onExploreApps,
}: EarnBtcContainerProps) {
  const { stxAddress } = useWalletAddresses();
  const { selectedNetwork } = useSelectedNetwork();
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);
  const [enrollTxId, setEnrollTxId] = useState<string | null>(null);

  const [isEnrollSheetOpen, setIsEnrollSheetOpen] = useState(false);
  const [isMintSbtcSheetOpen, setIsMintSbtcSheetOpen] = useState(false);
  const [isStackingPoolSheetOpen, setIsStackingPoolSheetOpen] = useState(false);
  const [isTermsSheetOpen, setIsTermsSheetOpen] = useState(false);
  const [isTermsDetailsSheetOpen, setIsTermsDetailsSheetOpen] = useState(false);

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
    data: minEnrollAmountSats,
    isLoading: isMinEnrollLoading,
    isError: isMinEnrollError,
  } = useMinHoldForEnrollment();

  const {
    balance: stxTotalBalance,
    lockedBalance: stxStacked,
    isLoading: isStxBalanceLoading,
  } = useStxBalance();

  const { data: hasAcceptedTerms } = useCheckTerms({
    variables: { address: stxAddress ?? "" },
    enabled: !!stxAddress,
  });

  const contractId = CONTRACTS[selectedNetwork].yieldV2;
  const enrollFunctionName = SC_FUNCTIONS.yieldV2.publicFunctions.ENROLL;

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
    functionArgs: [],
    enabled: isEnrollSheetOpen,
  });

  const isLoading =
    isEnrollmentLoading ||
    isComputationLoading ||
    isMinEnrollLoading ||
    isStxBalanceLoading;

  const isError = isEnrollmentError || isComputationError || isMinEnrollError;

  const sbtcBalance = fromSatsToBtc(sbtcBalanceSats);
  const minEnrollAmount = fromSatsToBtc(Number(minEnrollAmountSats ?? 0));

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

  const { isPending: isEnrollPending } = useTrackEnrollTx({
    txId: enrollTxId,
    onSuccess: () => {
      setIsSubmittingEnroll(false);
      setEnrollTxId(null);
      showMessage({ message: "Enrolled successfully", type: "success" });
    },
    onFailure: (_status, repr) => {
      setIsSubmittingEnroll(false);
      setEnrollTxId(null);
      showMessage({
        message: "Enrollment failed",
        description: repr,
        type: "danger",
      });
    },
  });

  const model = useMemo(
    () =>
      buildEarnBtcSteps({
        sbtcBalance,
        isEnrolledNextCycle: Boolean(enrolledNextCycle),
        isConnected: Boolean(stxAddress),
        minEnrollAmount,
        isStacking,
        isDeFiParticipant,
        hasEnrollMempoolTx: !!enrollTxId,
        enrollExplorerUrl,
      }),
    [
      sbtcBalance,
      enrolledNextCycle,
      stxAddress,
      minEnrollAmount,
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

    try {
      setIsSubmittingEnroll(true);

      const txId = await walletKit.makeContractCall(
        contractId,
        enrollFunctionName,
        [],
        PostConditionMode.Allow,
        feeMicroStx,
        useSettingsStore.getState().activeAccountIndex,
      );

      if (txId) {
        setEnrollTxId(txId);
        setIsEnrollSheetOpen(false);
        setIsSubmittingEnroll(false);
      } else {
        throw new Error("Broadcast failed");
      }
    } catch (e) {
      showMessage({
        message: "Enrollment failed",
        description: String(e),
        type: "danger",
      });
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
        isSubmitting={isSubmittingEnroll}
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
        onShowDetails={() => setIsTermsDetailsSheetOpen(true)}
        onAccept={() => handleOpenEnroll({ skipTermsCheck: true })}
      />
      <TermsDetailsSheet
        open={isTermsDetailsSheetOpen}
        onOpenChange={setIsTermsDetailsSheetOpen}
      />
      <TransactionLoadingOverlay
        visible={isEnrollPending}
        message="Broadcasting Enrollment"
      />
    </>
  );
}
