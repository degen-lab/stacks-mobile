import { useCallback, useMemo, useState } from "react";
import { type ClarityValue } from "@stacks/transactions";
import { isAxiosError } from "axios";

import { useFeeEstimation } from "@/api/stacks/use-fee";
import { FeeOption } from "@/features/stacking/components/fee-selector";
import { MICRO_STX } from "@/lib/format/currency";
import { useSelectedNetwork } from "@/lib/store/settings";

// Fallback when the node has no cost data for a contract function
const FALLBACK_FEE_MICRO_STX = 10_000;

type UseContractCallFeeArgs = {
  contractId: string;
  functionName: string;
  functionArgs: ClarityValue[];
  enabled?: boolean;
};

export function useContractCallFee({
  contractId,
  functionName,
  functionArgs,
  enabled = true,
}: UseContractCallFeeArgs) {
  const { selectedNetwork } = useSelectedNetwork();
  const [selectedFeeOption, setSelectedFeeOption] =
    useState<FeeOption>("standard");
  const [customFee, setCustomFee] = useState("");

  const [contractAddress = "", contractName = ""] = contractId.split(".");

  const {
    data: feeEstimations = [],
    isLoading: isLoadingFees,
    isError: isFeeError,
    error: feeError,
  } = useFeeEstimation({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    network: selectedNetwork,
    enabled: enabled && Boolean(contractAddress) && Boolean(contractName),
  });

  // The Stacks node returned 400 — it has no cost data for this function.
  const isFeeUnavailable =
    isFeeError && isAxiosError(feeError) && feeError.response?.status === 400;

  const feeMicroStx = useMemo(() => {
    if (selectedFeeOption === "custom") {
      const parsed = parseFloat(customFee) * MICRO_STX;
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    if (isFeeUnavailable) return FALLBACK_FEE_MICRO_STX;

    if (feeEstimations.length === 0) return undefined;

    if (selectedFeeOption === "low") return feeEstimations[0]?.fee;
    if (selectedFeeOption === "standard")
      return feeEstimations[1]?.fee ?? feeEstimations[0]?.fee;
    if (selectedFeeOption === "high")
      return feeEstimations[2]?.fee ?? feeEstimations[1]?.fee;

    return feeEstimations[1]?.fee;
  }, [customFee, feeEstimations, isFeeUnavailable, selectedFeeOption]);

  const isFeeValid =
    selectedFeeOption !== "custom" && feeMicroStx !== undefined
      ? true
      : selectedFeeOption === "custom" &&
        feeMicroStx !== undefined &&
        feeMicroStx > 0;

  const resetFeeState = useCallback(() => {
    setSelectedFeeOption("standard");
    setCustomFee("");
  }, []);

  return {
    network: selectedNetwork,
    selectedFeeOption,
    setSelectedFeeOption,
    customFee,
    setCustomFee,
    feeMicroStx,
    isFeeValid,
    isFeeUnavailable,
    isLoadingFees,
    resetFeeState,
  };
}
