import { useState } from "react";
import type { TransferAsset, SendStep, SendFormData } from "../types";

export function useSendFlow() {
  const [currentStep, setCurrentStep] = useState<SendStep>("asset");
  const [formData, setFormData] = useState<SendFormData>({
    asset: null as any, // No default selection
    recipient: "",
    memo: "",
    amount: "",
  });

  const updateAsset = (asset: TransferAsset) => {
    setFormData((prev) => ({ ...prev, asset }));
  };

  const updateRecipient = (recipient: string) => {
    setFormData((prev) => ({ ...prev, recipient }));
  };

  const updateMemo = (memo: string) => {
    setFormData((prev) => ({ ...prev, memo }));
  };

  const updateAmount = (amount: string) => {
    setFormData((prev) => ({ ...prev, amount }));
  };

  const goToStep = (step: SendStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    const steps: SendStep[] = ["asset", "amount", "recipient", "confirm"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const previousStep = () => {
    const steps: SendStep[] = ["asset", "amount", "recipient", "confirm"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const reset = () => {
    setCurrentStep("asset");
    setFormData({
      asset: null as any, // No default selection
      recipient: "",
      memo: "",
      amount: "",
    });
  };

  return {
    currentStep,
    formData,
    updateAsset,
    updateRecipient,
    updateMemo,
    updateAmount,
    goToStep,
    nextStep,
    previousStep,
    reset,
  };
}
