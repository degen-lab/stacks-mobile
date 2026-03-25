import { useColorScheme } from "nativewind";
import { useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native";

import { getDisallowanceArgs } from "@/api/stacks/fast-pool/fast-pool";
import { ContractCallDetailsSheet } from "@/components/contract-call-details-sheet";
import { Button, Modal, Text, View, colors } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { SC_FUNCTIONS } from "@/lib/stacks/contracts";

type LeavePoolAction = (
  feeMicroStx?: number,
) => Promise<boolean | void> | boolean | void;

type LeavePoolSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: string;
  poolContract: string;
  poxContract: string;
  isStacking: boolean;
  isAllowed: boolean;
  onRevoke?: LeavePoolAction;
  onSponsoredRevoke?: LeavePoolAction;
  onDisallow?: LeavePoolAction;
  onSponsoredDisallow?: LeavePoolAction;
  onGoBack?: () => void;
};

type ActiveSheet = "form" | "revoke" | "disallow" | "none";

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
  const { colorScheme } = useColorScheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRevokedLocally, setHasRevokedLocally] = useState(false);
  const activeSheetRef = useRef<ActiveSheet>("none");
  const isClosingRef = useRef(false);

  const needsRevoke = isStacking && !hasRevokedLocally;
  const needsDisallow = isAllowed || hasRevokedLocally;
  const canLeavePool = needsRevoke || needsDisallow;

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      activeSheetRef.current = "form";
      presentForm();
    } else {
      isClosingRef.current = true;
      activeSheetRef.current = "none";
      dismissForm();
      dismissRevoke();
      dismissDisallow();
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!isStacking && !isAllowed) {
      setHasRevokedLocally(false);
    }
  }, [isAllowed, isStacking]);

  const closeFlow = () => {
    if (isSubmitting) return;
    isClosingRef.current = true;
    activeSheetRef.current = "none";
    onOpenChange(false);
  };

  const handleGoBack = () => {
    if (isSubmitting) return;
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

  const handleConfirmRevoke = async (feeMicroStx?: number) => {
    const ok = await runAction(() => onRevoke?.(feeMicroStx));
    if (!ok) return;

    setHasRevokedLocally(true);
    activeSheetRef.current = "disallow";
    dismissRevoke();
    presentDisallow();
  };

  const handleSponsoredRevoke = async (feeMicroStx?: number) => {
    const ok = await runAction(() => onSponsoredRevoke?.(feeMicroStx));
    if (!ok) return;

    setHasRevokedLocally(true);
    activeSheetRef.current = "disallow";
    dismissRevoke();
    presentDisallow();
  };

  const handleConfirmDisallow = async (feeMicroStx?: number) => {
    const ok = await runAction(() => onDisallow?.(feeMicroStx));
    if (ok) {
      closeFlow();
    }
  };

  const handleSponsoredDisallow = async (feeMicroStx?: number) => {
    const ok = await runAction(() => onSponsoredDisallow?.(feeMicroStx));
    if (ok) {
      closeFlow();
    }
  };

  const leaveDescription = needsRevoke
    ? "Leaving Fast Pool takes 2 transactions. First you revoke the current delegation, then you remove Fast Pool's contract-caller permission. Your locked STX will still unlock only after the current cycle ends."
    : "Your delegation is already revoked. One final transaction remains to remove Fast Pool's contract-caller permission from your account.";

  return (
    <>
      <Modal
        ref={formRef}
        title="Leave Fast Pool"
        snapPoints={["56%"]}
        backgroundStyle={{
          backgroundColor:
            colorScheme === "dark" ? colors.charcoal[850] : colors.white,
        }}
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
        <ScrollView className="flex-1" contentContainerClassName="pb-6">
          <View className="px-6 gap-6">
            <Text className="text-sm font-instrument-sans leading-relaxed text-secondary">
              {leaveDescription}
            </Text>

            <View className="gap-3">
              <Button
                label="Review transactions"
                variant="gamePrimary"
                size="lg"
                onPress={handleOpenReview}
                disabled={!canLeavePool || isSubmitting}
              />
              <Button
                label={onGoBack ? "Go back and keep earning" : "Cancel"}
                variant="secondary"
                size="lg"
                onPress={onGoBack ? handleGoBack : closeFlow}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </Modal>

      <ContractCallDetailsSheet
        ref={revokeRef}
        title="Revoke delegation"
        description="This first transaction stops Fast Pool from managing your current delegation. Your locked STX remains locked until the cycle ends."
        snapPoints={["58%"]}
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
        title="Remove Fast Pool permission"
        description="This transaction removes Fast Pool's contract-caller permission so the pool can no longer manage your stacking rights."
        snapPoints={["58%"]}
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
    </>
  );
}
