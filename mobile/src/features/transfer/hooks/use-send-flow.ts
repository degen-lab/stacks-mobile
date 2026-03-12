import { useCallback, useMemo, useState } from "react";
import type {
  TransferAsset,
  SendStep,
  SendFormData,
  SendFieldLocks,
  SendFlowRequest,
} from "../types";

const DEFAULT_LOCKS: SendFieldLocks = {
  asset: false,
  recipient: false,
  memo: false,
  amount: false,
};

const createEmptyFormData = (): SendFormData => ({
  asset: null,
  recipient: "",
  memo: "",
  amount: "",
  source: "manual",
});

const getInitialStep = (formData: SendFormData): SendStep => {
  if (formData.asset && formData.amount && formData.recipient) {
    return "confirm";
  }
  if (formData.asset && formData.amount) {
    return "recipient";
  }
  if (formData.asset) {
    return "amount";
  }
  return "asset";
};

export function useSendFlow() {
  const [currentStep, setCurrentStep] = useState<SendStep>("asset");
  const [formData, setFormData] = useState<SendFormData>(createEmptyFormData);
  const [locks, setLocks] = useState<SendFieldLocks>(DEFAULT_LOCKS);

  const updateAsset = useCallback(
    (asset: TransferAsset) => {
      if (locks.asset) return;
      setFormData((prev) => ({ ...prev, asset }));
    },
    [locks.asset],
  );

  const updateRecipient = useCallback(
    (recipient: string) => {
      if (locks.recipient) return;
      setFormData((prev) => ({ ...prev, recipient }));
    },
    [locks.recipient],
  );

  const updateMemo = useCallback(
    (memo: string) => {
      if (locks.memo) return;
      setFormData((prev) => ({ ...prev, memo }));
    },
    [locks.memo],
  );

  const updateAmount = useCallback(
    (amount: string) => {
      if (locks.amount) return;
      setFormData((prev) => ({ ...prev, amount }));
    },
    [locks.amount],
  );

  const nextStep = useCallback(() => {
    const steps: SendStep[] = ["asset", "amount", "recipient", "confirm"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    const steps: SendStep[] = ["asset", "amount", "recipient", "confirm"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  const initialize = useCallback((request?: SendFlowRequest) => {
    const nextForm: SendFormData = {
      asset: request?.asset ?? null,
      recipient: request?.recipient ?? "",
      memo: request?.memo ?? "",
      amount: request?.amount ?? "",
      source: request?.source ?? "manual",
    };
    setLocks({ ...DEFAULT_LOCKS, ...(request?.locks ?? {}) });
    setFormData(nextForm);
    setCurrentStep(getInitialStep(nextForm));
  }, []);

  const reset = useCallback(() => {
    setLocks(DEFAULT_LOCKS);
    setCurrentStep("asset");
    setFormData(createEmptyFormData());
  }, []);

  return useMemo(
    () => ({
      currentStep,
      formData,
      locks,
      updateAsset,
      updateRecipient,
      updateMemo,
      updateAmount,
      nextStep,
      previousStep,
      initialize,
      reset,
    }),
    [
      currentStep,
      formData,
      locks,
      updateAsset,
      updateRecipient,
      updateMemo,
      updateAmount,
      nextStep,
      previousStep,
      initialize,
      reset,
    ],
  );
}
