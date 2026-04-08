import { showMessage } from "react-native-flash-message";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { getDisallowanceArgs } from "@/api/stacks/fast-pool/fast-pool";
import { ContractCallDetailsSheet } from "@/components/contract-call-details-sheet";
import { Button, Modal, Text, View } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { TransactionStatusSheet } from "@/features/dual-stacking/components/layout/modals/transaction-status-sheet";
import { SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { useSponsoredRequestFlow } from "../hooks/use-sponsored-request-flow";

type LeavePoolAction = (
  feeMicroStx?: number,
) => Promise<boolean | void> | boolean | void;

type SponsoredLeavePoolAction = (
  feeMicroStx?: number,
) => Promise<number | false | void> | number | false | void;

type LeavePoolSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: string;
  poolContract: string;
  poxContract: string;
  isStacking: boolean;
  isAllowed: boolean;
  onRevoke?: LeavePoolAction;
  onSponsoredRevoke?: SponsoredLeavePoolAction;
  onDisallow?: LeavePoolAction;
  onSponsoredDisallow?: SponsoredLeavePoolAction;
  onSponsoredSuccess?: () => void;
  onGoBack?: () => void;
};

type ActiveSheet = "form" | "revoke" | "disallow" | "none";
type SponsoredStep = "revoke" | "disallow" | null;

export function LeavePoolSheet({
  open,
  onOpenChange,
  network,
  poolContract,
  poxContract,
  isStacking,
  isAllowed,
  onRevoke,
  onSponsoredRevoke,
  onDisallow,
  onSponsoredDisallow,
  onSponsoredSuccess,
  onGoBack,
}: LeavePoolSheetProps) {
  const {
    ref: formRef,
    present: presentForm,
    dismiss: dismissForm,
  } = useModal();
  const {
    ref: revokeRef,
    present: presentRevoke,
    dismiss: dismissRevoke,
  } = useModal();
  const {
    ref: disallowRef,
    present: presentDisallow,
    dismiss: dismissDisallow,
  } = useModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRevokedLocally, setHasRevokedLocally] = useState(false);
  const [sponsoredRequestId, setSponsoredRequestId] = useState<number | null>(
    null,
  );
  const [activeSponsoredStep, setActiveSponsoredStep] =
    useState<SponsoredStep>(null);
  const activeSheetRef = useRef<ActiveSheet>("none");
  const activeSponsoredStepRef = useRef<SponsoredStep>(null);
  const isClosingRef = useRef(false);

  const updateActiveSponsoredStep = useCallback((step: SponsoredStep) => {
    activeSponsoredStepRef.current = step;
    setActiveSponsoredStep(step);
  }, []);

  const needsRevoke = isStacking && !hasRevokedLocally;
  const needsDisallow = isAllowed || hasRevokedLocally;
  const canLeavePool = needsRevoke || needsDisallow;
  const isSponsoredStepPending = sponsoredRequestId !== null;

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      activeSheetRef.current = "form";
      presentForm();
    } else {
      isClosingRef.current = true;
      activeSheetRef.current = "none";
      setSponsoredRequestId(null);
      updateActiveSponsoredStep(null);
      dismissForm();
      dismissRevoke();
      dismissDisallow();
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, updateActiveSponsoredStep]);

  useEffect(() => {
    if (!isStacking && !isAllowed) {
      setHasRevokedLocally(false);
    }
  }, [isAllowed, isStacking]);

  const closeFlow = useCallback(
    (force = false) => {
      if (!force && (isSubmitting || isSponsoredStepPending)) return;
      isClosingRef.current = true;
      activeSheetRef.current = "none";
      onOpenChange(false);
    },
    [isSponsoredStepPending, isSubmitting, onOpenChange],
  );

  const sponsoredStepCopy = useMemo(() => {
    const actionLabel =
      activeSponsoredStep === "disallow" ? "permission removal" : "revocation";

    return {
      verifying: {
        title: `Verifying ${actionLabel}...`,
        message:
          "Waiting for ad verification before your sponsored transaction can be broadcast.",
      },
      queued: {
        title:
          activeSponsoredStep === "disallow"
            ? "Permission removal queued..."
            : "Revocation queued...",
        message:
          activeSponsoredStep === "disallow"
            ? "Your sponsored permission removal is queued and will be broadcast shortly."
            : "Your sponsored revocation is queued and will be broadcast shortly.",
      },
      blocked: {
        title: "Waiting for previous transaction...",
        message:
          "Another sponsored transaction from this wallet is still pending. This step will continue once that transaction confirms.",
      },
      confirming: {
        title:
          activeSponsoredStep === "disallow"
            ? "Permission removal pending..."
            : "Revocation pending...",
        message:
          activeSponsoredStep === "disallow"
            ? "Your sponsored permission removal is on chain."
            : "Your sponsored revocation is on chain. Waiting for confirmation before the next step.",
      },
      preparing: {
        title: `Preparing ${actionLabel}...`,
        message:
          "Please wait while we finalize your sponsored transaction request.",
      },
    };
  }, [activeSponsoredStep]);

  const { loadingCopy: sponsoredStepLoadingCopy } = useSponsoredRequestFlow({
    requestId: sponsoredRequestId,
    completeOn:
      activeSponsoredStep === "revoke" ? ["success"] : ["pending", "success"],
    copy: sponsoredStepCopy,
    onComplete: () => {
      if (isClosingRef.current || !activeSponsoredStep) return;

      const completedStep = activeSponsoredStep;
      onSponsoredSuccess?.();
      setSponsoredRequestId(null);
      updateActiveSponsoredStep(null);

      if (completedStep === "revoke") {
        setHasRevokedLocally(true);
        showMessage({
          message: "Revocation confirmed",
          description: "You can now remove Fast Pool's permission.",
          type: "success",
        });
        activeSheetRef.current = "disallow";
        requestAnimationFrame(() => {
          presentDisallow();
        });
        return;
      }

      showMessage({
        message: "Permission removal broadcasted",
        description: "Fast Pool can no longer manage your stacking rights.",
        type: "success",
      });
      closeFlow(true);
    },
    onFailed: () => {
      if (isClosingRef.current || !activeSponsoredStep) return;

      const failedStep = activeSponsoredStep;
      setSponsoredRequestId(null);
      updateActiveSponsoredStep(null);
      activeSheetRef.current = failedStep;
      showMessage({
        message:
          failedStep === "revoke"
            ? "Revocation failed"
            : "Permission removal failed",
        description:
          "The sponsored transaction could not be broadcast. Please try again.",
        type: "danger",
      });
      requestAnimationFrame(() => {
        if (failedStep === "revoke") {
          presentRevoke();
          return;
        }
        presentDisallow();
      });
    },
    onStatusUnavailable: ({ error }) => {
      if (isClosingRef.current || !activeSponsoredStep) return;

      const failedStep = activeSponsoredStep;
      setSponsoredRequestId(null);
      updateActiveSponsoredStep(null);
      activeSheetRef.current = failedStep;
      showMessage({
        message: "Transaction status unavailable",
        description:
          error instanceof Error
            ? error.message
            : "We couldn't confirm the sponsored transaction status.",
        type: "danger",
      });
      requestAnimationFrame(() => {
        if (failedStep === "revoke") {
          presentRevoke();
          return;
        }
        presentDisallow();
      });
      console.error("Sponsored leave-pool status unavailable:", error);
    },
  });

  const handleGoBack = () => {
    if (isSubmitting || isSponsoredStepPending) return;
    onGoBack?.();
    closeFlow();
  };

  const openStep = (step: Extract<ActiveSheet, "revoke" | "disallow">) => {
    activeSheetRef.current = step;
    dismissForm();
    if (step === "revoke") {
      presentRevoke();
      return;
    }
    presentDisallow();
  };

  const handleOpenReview = () => {
    if (isSubmitting || !canLeavePool) return;
    openStep(needsRevoke ? "revoke" : "disallow");
  };

  const handleReturnToForm = (
    from: Extract<ActiveSheet, "revoke" | "disallow">,
  ) => {
    if (
      isSubmitting ||
      isClosingRef.current ||
      activeSheetRef.current !== from
    ) {
      return;
    }

    activeSheetRef.current = "form";
    if (from === "revoke") {
      dismissRevoke();
    } else {
      dismissDisallow();
    }
    presentForm();
  };

  const runAction = async (action?: LeavePoolAction) => {
    if (!action || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const result = await action();
      return result !== false;
    } catch (error) {
      console.error("Failed to leave Fast Pool:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const runSponsoredAction = async (
    action?: SponsoredLeavePoolAction,
  ): Promise<number | false | void> => {
    if (!action || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      const result = await action();
      return result === false ? false : result;
    } catch (error) {
      console.error("Failed to leave Fast Pool:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRevoke = async (feeMicroStx?: number) => {
    const ok = await runAction(() => onRevoke?.(feeMicroStx));
    if (!ok) return;

    setHasRevokedLocally(true);
    showMessage({
      message: "Delegation revoked",
      description: "You can now remove Fast Pool's permission.",
      type: "success",
    });
    activeSheetRef.current = "disallow";
    dismissRevoke();
    presentDisallow();
  };

  const handleSponsoredRevoke = async (feeMicroStx?: number) => {
    const requestId = await runSponsoredAction(() =>
      onSponsoredRevoke?.(feeMicroStx),
    );
    if (typeof requestId !== "number") return;

    updateActiveSponsoredStep("revoke");
    setSponsoredRequestId(requestId);
    activeSheetRef.current = "none";
    dismissRevoke();
  };

  const handleConfirmDisallow = async (feeMicroStx?: number) => {
    const ok = await runAction(() => onDisallow?.(feeMicroStx));
    if (!ok) return;

    showMessage({
      message: "Permission removed",
      description: "Fast Pool can no longer manage your stacking rights.",
      type: "success",
    });
    closeFlow();
  };

  const handleSponsoredDisallow = async (feeMicroStx?: number) => {
    const requestId = await runSponsoredAction(() =>
      onSponsoredDisallow?.(feeMicroStx),
    );
    if (typeof requestId !== "number") return;

    updateActiveSponsoredStep("disallow");
    setSponsoredRequestId(requestId);
    activeSheetRef.current = "none";
    dismissDisallow();
  };

  const leaveDescription = needsRevoke
    ? "Leaving Fast Pool takes 2 transactions. First you revoke the current delegation, then you remove Fast Pool's contract-caller permission. Your locked STX will still unlock only after the current cycle ends."
    : "Remove Fast Pool's contract-caller permission from your account.";
  const reviewLabel = needsRevoke
    ? "Review transactions"
    : "Review transaction";
  const secondaryActionLabel = onGoBack ? "Go back" : "Cancel";

  return (
    <>
      <Modal
        ref={formRef}
        title="Leave Fast Pool"
        enableDynamicSizing={true}
        enablePanDownToClose
        onDismiss={() => {
          if (activeSheetRef.current === "form") {
            if (onGoBack) {
              handleGoBack();
              return;
            }
            closeFlow();
          }
        }}
      >
        <BottomSheetScrollView
          contentContainerClassName="px-6 pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-6">
            <Text className="text-sm font-instrument-sans leading-relaxed text-secondary">
              {leaveDescription}
            </Text>

            <View className="gap-3">
              <Button
                label={reviewLabel}
                variant="gamePrimary"
                size="lg"
                onPress={handleOpenReview}
                disabled={
                  !canLeavePool || isSubmitting || isSponsoredStepPending
                }
              />
              <Button
                label={secondaryActionLabel}
                variant="ghost"
                size="lg"
                onPress={() => {
                  if (onGoBack) {
                    handleGoBack();
                    return;
                  }
                  closeFlow();
                }}
                disabled={isSubmitting || isSponsoredStepPending}
              />
            </View>
          </View>
        </BottomSheetScrollView>
      </Modal>

      <ContractCallDetailsSheet
        ref={revokeRef}
        title="Revoke delegation"
        enableDynamicSizing
        network={network}
        contractAddress={poxContract}
        functionName={SC_FUNCTIONS.pox.publicFunctions.REVOKE_DELEGATE_STX}
        feeFunctionArgs={[]}
        showFeeSelector
        confirmLabel="Use wallet funds"
        sponsoredConfirmLabel="Watch an ad"
        onConfirm={(feeMicroStx) => {
          void handleConfirmRevoke(feeMicroStx);
        }}
        onSponsoredConfirm={
          onSponsoredRevoke
            ? (feeMicroStx) => void handleSponsoredRevoke(feeMicroStx)
            : undefined
        }
        onClose={() => handleReturnToForm("revoke")}
        isLoading={isSubmitting}
        confirmDisabled={isSubmitting}
        sponsoredConfirmDisabled={isSubmitting}
      />

      <ContractCallDetailsSheet
        ref={disallowRef}
        title="Remove permission"
        enableDynamicSizing
        network={network}
        contractAddress={poxContract}
        functionName={SC_FUNCTIONS.pox.publicFunctions.DISALLOW_CONTRACT_CALLER}
        contractArgs={[
          {
            name: "caller",
            value: poolContract,
            type: "principal",
          },
        ]}
        feeFunctionArgs={getDisallowanceArgs(poolContract)}
        showFeeSelector
        confirmLabel="Use wallet funds"
        sponsoredConfirmLabel="Watch an ad"
        onConfirm={(feeMicroStx) => {
          void handleConfirmDisallow(feeMicroStx);
        }}
        onSponsoredConfirm={
          onSponsoredDisallow
            ? (feeMicroStx) => void handleSponsoredDisallow(feeMicroStx)
            : undefined
        }
        onClose={() => handleReturnToForm("disallow")}
        isLoading={isSubmitting}
        confirmDisabled={isSubmitting}
        sponsoredConfirmDisabled={isSubmitting}
      />

      <TransactionStatusSheet
        open={isSponsoredStepPending}
        isLoading={true}
        loading={sponsoredStepLoadingCopy}
        success={{
          title: "Transaction broadcasted",
          message: "Your sponsored transaction is now on chain.",
        }}
        dismissibleWhenLoading={true}
        onOpenChange={(open) => {
          if (open) return;

          if (!activeSponsoredStepRef.current) return;

          setSponsoredRequestId(null);
          updateActiveSponsoredStep(null);
          closeFlow(true);
        }}
        enableDynamicSizing={true}
      />
    </>
  );
}
