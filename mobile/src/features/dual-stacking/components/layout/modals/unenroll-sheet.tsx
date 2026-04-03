import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState } from "react";

import {
  Button,
  Checkbox,
  Modal,
  Pressable,
  Text,
  View,
} from "@/components/ui";
import { ContractCallDetailsSheet } from "@/components/contract-call-details-sheet";
import { useModal } from "@/components/ui/modal";
import {
  INITIAL_UNENROLL_REASONS,
  UNENROLL_REASON_LABEL,
  type UnenrollReasonKey,
} from "@/api/dual-stacking/enrollment/save-unenrollment-reasons";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { useSelectedNetwork } from "@/lib/store/settings";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";

type UnenrollSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (params: {
    reasons: UnenrollReasonKey[];
    feeMicroStx?: number;
  }) => Promise<boolean> | boolean;
  onSponsoredConfirm?: (params: {
    reasons: UnenrollReasonKey[];
    feeMicroStx?: number;
  }) => Promise<boolean> | boolean;
  onGoBack?: () => void;
  isSponsoredSubmitting?: boolean;
};

export function UnenrollSheet({
  open,
  onOpenChange,
  onConfirm,
  onSponsoredConfirm,
  onGoBack,
  isSponsoredSubmitting = false,
}: UnenrollSheetProps) {
  const {
    ref: formRef,
    present: presentForm,
    dismiss: dismissForm,
  } = useModal();
  const {
    ref: confirmRef,
    present: presentConfirm,
    dismiss: dismissConfirm,
  } = useModal();
  const { selectedNetwork } = useSelectedNetwork();
  const [reasons, setReasons] = useState<Record<UnenrollReasonKey, boolean>>({
    ...INITIAL_UNENROLL_REASONS,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Tracks which sheet is currently shown to prevent re-entrant calls
  const activeSheetRef = useRef<"form" | "confirm" | "none">("none");
  // Blocks onDismiss callbacks from firing side-effects during programmatic close
  const isClosingRef = useRef(false);

  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const contractId = CONTRACTS[selectedNetwork][contractType];
  const functionName = SC_FUNCTIONS[contractType].publicFunctions.OPT_OUT;

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      activeSheetRef.current = "form";
      presentForm();
    } else {
      isClosingRef.current = true;
      activeSheetRef.current = "none";
      dismissForm();
      dismissConfirm();
      setReasons({ ...INITIAL_UNENROLL_REASONS });
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleReasonChange = (key: UnenrollReasonKey, checked: boolean) => {
    setReasons((prev) => ({ ...prev, [key]: checked }));
  };

  const handleGoBack = () => {
    if (isSubmitting) return;
    onGoBack?.();
    onOpenChange(false);
  };

  const handleOpenContractCall = () => {
    if (isSubmitting || activeSheetRef.current !== "form") return;
    activeSheetRef.current = "confirm";
    dismissForm();
    presentConfirm();
  };

  const handleReturnToForm = () => {
    if (
      isSubmitting ||
      isClosingRef.current ||
      activeSheetRef.current !== "confirm"
    )
      return;
    activeSheetRef.current = "form";
    dismissConfirm();
    presentForm();
  };

  const handleConfirm = async (feeMicroStx?: number) => {
    if (isSubmitting) return;

    const selected = (Object.entries(reasons) as [UnenrollReasonKey, boolean][])
      .filter(([, value]) => value)
      .map(([key]) => key);

    setIsSubmitting(true);
    try {
      const ok = await onConfirm?.({ reasons: selected, feeMicroStx });
      if (ok !== false) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSponsoredConfirm = async (feeMicroStx?: number) => {
    if (!onSponsoredConfirm) return;

    const selected = (Object.entries(reasons) as [UnenrollReasonKey, boolean][])
      .filter(([, value]) => value)
      .map(([key]) => key);

    const ok = await onSponsoredConfirm({ reasons: selected, feeMicroStx });
    if (ok !== false) {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Modal
        ref={formRef}
        title="Unenroll from Dual Stacking"
        enableDynamicSizing={true}
        enablePanDownToClose
        onDismiss={() => {
          if (activeSheetRef.current === "form") {
            handleGoBack();
          }
        }}
      >
        <BottomSheetScrollView contentContainerClassName="pb-6">
          <View className="px-6">
            <Text className="mb-6 text-sm font-instrument-sans leading-relaxed text-secondary">
              By unenrolling you&apos;ll stop earning rewards.
            </Text>

            <View className="mb-6 gap-4">
              <Text className="font-matter text-xl text-primary">
                Reason to unenroll (optional)
              </Text>

              <View className="gap-2">
                {(
                  Object.entries(UNENROLL_REASON_LABEL) as [
                    UnenrollReasonKey,
                    string,
                  ][]
                ).map(([key, label]) => (
                  <Pressable
                    key={key}
                    onPress={() => handleReasonChange(key, !reasons[key])}
                    className="rounded-2xl border border-surface-secondary bg-neutral-100 px-4 py-4 dark:border-border-primary dark:bg-surface-secondary"
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: reasons[key] }}
                    accessibilityLabel={label}
                  >
                    <View className="flex-row items-center">
                      <Checkbox.Icon checked={reasons[key]} />
                      <Text className="pl-2 font-instrument-sans text-base leading-6 text-primary">
                        {label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="gap-3">
              <Button
                label="Confirm unenroll"
                variant="gamePrimary"
                size="lg"
                onPress={handleOpenContractCall}
                disabled={isSubmitting}
              />
              <Button
                label="Go back and keep earning rewards"
                variant="ghost"
                size="lg"
                onPress={handleGoBack}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </BottomSheetScrollView>
      </Modal>

      <ContractCallDetailsSheet
        ref={confirmRef}
        title="Unenroll"
        enableDynamicSizing={true}
        network={selectedNetwork}
        contractAddress={contractId}
        functionName={functionName}
        showFeeSelector
        confirmLabel="Use wallet funds"
        sponsoredConfirmLabel="Watch an ad"
        onConfirm={(feeMicroStx) => {
          void handleConfirm(feeMicroStx);
        }}
        onSponsoredConfirm={
          onSponsoredConfirm
            ? (feeMicroStx) => void handleSponsoredConfirm(feeMicroStx)
            : undefined
        }
        onClose={handleReturnToForm}
        isLoading={isSubmitting}
        confirmDisabled={isSubmitting}
        isSponsoredLoading={isSponsoredSubmitting}
        sponsoredConfirmDisabled={isSubmitting}
      />
    </>
  );
}
