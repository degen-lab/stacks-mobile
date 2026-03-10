import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

import {
  Button,
  Checkbox,
  Modal,
  Pressable,
  Text,
  View,
  colors,
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
  onGoBack?: () => void;
};

type SheetStep = "form" | "confirm";

export function UnenrollSheet({
  open,
  onOpenChange,
  onConfirm,
  onGoBack,
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
  const { colorScheme } = useColorScheme();
  const { selectedNetwork } = useSelectedNetwork();
  const [reasons, setReasons] = useState<Record<UnenrollReasonKey, boolean>>({
    ...INITIAL_UNENROLL_REASONS,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<SheetStep>("form");
  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const contractId = CONTRACTS[selectedNetwork][contractType];
  const functionName = SC_FUNCTIONS[contractType].publicFunctions.OPT_OUT;

  useEffect(() => {
    if (!open) {
      dismissForm();
      dismissConfirm();
      setStep("form");
      setReasons({ ...INITIAL_UNENROLL_REASONS });
      setIsSubmitting(false);
      return;
    }

    if (step === "form") {
      presentForm();
      dismissConfirm();
      return;
    }

    dismissForm();
    presentConfirm();
  }, [dismissConfirm, dismissForm, open, presentConfirm, presentForm, step]);

  const handleReasonChange = (key: UnenrollReasonKey, checked: boolean) => {
    setReasons((prev) => ({ ...prev, [key]: checked }));
  };

  const handleGoBack = () => {
    if (isSubmitting) return;
    onGoBack?.();
    onOpenChange(false);
  };

  const handleOpenContractCall = () => {
    if (isSubmitting) return;
    setStep("confirm");
  };

  const handleReturnToForm = () => {
    if (isSubmitting) return;
    setStep("form");
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

  return (
    <>
      <Modal
        ref={formRef}
        title="Unenroll from Dual Stacking"
        snapPoints={["68%"]}
        backgroundStyle={{
          backgroundColor:
            colorScheme === "dark" ? colors.charcoal[850] : colors.white,
        }}
        enablePanDownToClose
        onDismiss={() => {
          if (step === "form") {
            handleGoBack();
          }
        }}
      >
        <ScrollView className="flex-1" contentContainerClassName="pb-6">
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
                    className="rounded-2xl border border-surface-secondary bg-neutral-100 px-4 py-4"
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
                variant="secondary"
                size="lg"
                onPress={handleGoBack}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </Modal>

      <ContractCallDetailsSheet
        ref={confirmRef}
        title="Unenroll from Dual Stacking"
        description="Review the opt-out contract call before broadcasting it."
        snapPoints={["55%"]}
        network={selectedNetwork}
        contractAddress={contractId}
        functionName={functionName}
        showFeeSelector
        confirmLabel="Confirm unenroll"
        onConfirm={(feeMicroStx) => {
          void handleConfirm(feeMicroStx);
        }}
        onClose={handleReturnToForm}
        isLoading={isSubmitting}
        confirmDisabled={isSubmitting}
      />
    </>
  );
}
