import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard } from "react-native";
import { showMessage } from "react-native-flash-message";

import {
  usePrepareSwap,
  useSwapParams,
  useSwapPossiblePairs,
} from "@/api/defi";
import { useFeeEstimation } from "@/api/stacks/use-fee";
import { useDebounce } from "@/hooks/use-debounce";
import { formatMicroStx } from "@/lib/format/currency";
import { sanitizeDecimal } from "@/lib/format/decimal";
import { useSelectedNetwork } from "@/lib/store/settings";
import type { FeeOption } from "@/features/stacking/components/fee-selector";
import type { SwapAsset, SwapSheetRequest, SwapSheetStep } from "../types";
import { parseSerializedContractCallParams } from "../serialization";
import {
  baseUnitsToDisplayString,
  compareBaseUnitAmounts,
  displayAmountToBaseUnits,
  getMinimumReceivedBaseUnits,
  STX_TOKEN_ID,
  sortSwapAssets,
} from "../utils";
import { useSwapAssets } from "./use-swap-assets";
import { useSwapExecution } from "./use-swap-execution";

type UseSwapOptions = {
  open: boolean;
  request?: SwapSheetRequest;
  requestVersion?: number;
  onClose: () => void;
};

export type SwapViewModel = {
  step: SwapSheetStep;
  sourceToken: SwapAsset | null;
  destinationToken: SwapAsset | null;
  destinationEmptyState: string;
  amountInput: string;
  minimumReceivedLabel: string | null;
  isLoading: boolean;
  isExecuting: boolean;
  isSubmittingSponsored: boolean;
  isQuoteLoading: boolean;
  stepError?: string;
  canContinue: boolean;
  canSubmitSponsored: boolean;
  canSubmitWallet: boolean;
  selectedFeeOption: FeeOption;
  walletFeeLabel: string;
  isLoadingWalletFee: boolean;
  isPickerLoading: boolean;
  pickerTokens: SwapAsset[];
  pickerSelectedTokenId: string;
  pickerEmptyMessage: string;
  onAmountChange: (value: string) => void;
  onFeeOptionChange: (option: FeeOption) => void;
  onFlip: () => void;
  onMax: () => void;
  onPickerSelect: (token: SwapAsset) => void;
  onOpenSourceSelector: () => void;
  onOpenDestinationSelector: () => void;
  onBack: () => void;
  onReview: () => void;
  onConfirm: () => Promise<void>;
  onSponsoredConfirm: () => Promise<void>;
  onDismiss: () => void;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const msg =
      (error as { response?: { data?: { message?: string } } }).response?.data
        ?.message ?? (error as { message?: string }).message;
    return msg ?? fallback;
  }
  return fallback;
}

export function useSwap({
  open,
  request,
  requestVersion,
  onClose,
}: UseSwapOptions): SwapViewModel {
  const {
    assets,
    assetMap,
    defaultSourceTokenId,
    error,
    isLoading,
    stxAddress,
  } = useSwapAssets();
  const { selectedNetwork } = useSelectedNetwork();
  const {
    executeSwap,
    executeSwapSponsored,
    isExecuting,
    isSubmittingSponsored,
  } = useSwapExecution();
  const { mutateAsync: prepareSwap } = usePrepareSwap();

  const [step, setStep] = useState<SwapSheetStep>("form");
  const [sourceTokenId, setSourceTokenId] = useState("");
  const [destinationTokenId, setDestinationTokenId] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [selectedFeeOption, setSelectedFeeOption] =
    useState<FeeOption>("standard");
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setAmountInput(request?.amount ?? "");
    setSourceTokenId(request?.sourceTokenId ?? "");
    setDestinationTokenId(request?.destinationTokenId ?? "");
    setSelectedFeeOption("standard");
  }, [open, request, requestVersion]);

  useEffect(() => {
    if (!open || !assets.length) return;
    if (sourceTokenId && assetMap[sourceTokenId]) return;
    const id =
      request?.sourceTokenId && assetMap[request.sourceTokenId]
        ? request.sourceTokenId
        : defaultSourceTokenId;
    if (id) setSourceTokenId(id);
  }, [
    assetMap,
    assets.length,
    defaultSourceTokenId,
    open,
    request?.sourceTokenId,
    sourceTokenId,
  ]);

  const sourceToken = sourceTokenId ? (assetMap[sourceTokenId] ?? null) : null;
  const sourceDecimals = sourceToken?.decimals ?? 8;

  useEffect(() => {
    setAmountInput((current) => sanitizeDecimal(current, sourceDecimals));
  }, [sourceDecimals]);

  const possiblePairsQuery = useSwapPossiblePairs({
    variables: { tokenId: sourceTokenId },
    enabled: open && Boolean(sourceTokenId),
  });

  const destinationAssets = useMemo(
    () =>
      Object.keys(possiblePairsQuery.data ?? {})
        .map((tokenId) => assetMap[tokenId])
        .filter((a): a is SwapAsset => Boolean(a))
        .sort(sortSwapAssets),
    [assetMap, possiblePairsQuery.data],
  );

  useEffect(() => {
    if (!open) return;
    if (!destinationAssets.length) {
      if (destinationTokenId) setDestinationTokenId("");
      return;
    }
    if (
      destinationTokenId &&
      destinationAssets.some((a) => a.tokenId === destinationTokenId)
    )
      return;
    const id =
      request?.destinationTokenId &&
      destinationAssets.some((a) => a.tokenId === request.destinationTokenId)
        ? request.destinationTokenId
        : destinationAssets[0]?.tokenId;
    if (id) setDestinationTokenId(id);
  }, [
    destinationAssets,
    destinationTokenId,
    open,
    request?.destinationTokenId,
  ]);

  const destinationToken = destinationTokenId
    ? (assetMap[destinationTokenId] ?? null)
    : null;

  const amountBaseUnits = useMemo(
    () =>
      sourceToken
        ? displayAmountToBaseUnits(amountInput, sourceToken.decimals)
        : null,
    [amountInput, sourceToken],
  );

  const trimmedAmountInput = amountInput.trim();
  const debouncedAmountInput = useDebounce(trimmedAmountInput, 350);
  const hasNonZeroAmount =
    amountBaseUnits !== null && BigInt(amountBaseUnits) > 0n;
  const hasSufficientBalance =
    !!sourceToken &&
    !!amountBaseUnits &&
    compareBaseUnitAmounts(amountBaseUnits, sourceToken.balanceBaseUnits) <= 0;
  const hasCurrentAmountQuote = trimmedAmountInput === debouncedAmountInput;

  const amountPositiveForApi =
    debouncedAmountInput !== "" &&
    !Number.isNaN(parseFloat(debouncedAmountInput)) &&
    parseFloat(debouncedAmountInput) > 0;

  const canRequestQuote =
    open &&
    Boolean(stxAddress) &&
    Boolean(sourceTokenId) &&
    Boolean(destinationTokenId) &&
    destinationAssets.some((a) => a.tokenId === destinationTokenId) &&
    amountPositiveForApi &&
    hasNonZeroAmount &&
    hasSufficientBalance;

  const swapParamsQuery = useSwapParams({
    variables: {
      tokenInId: sourceTokenId,
      tokenOutId: destinationTokenId,
      amount: debouncedAmountInput,
      senderAddress: stxAddress ?? "",
    },
    enabled: canRequestQuote,
  });

  const parsedSwapContractCall = useMemo(() => {
    if (!swapParamsQuery.data) {
      return { value: null, error: null as unknown };
    }

    try {
      return {
        value: parseSerializedContractCallParams(
          swapParamsQuery.data.contractCallParams,
        ),
        error: null as unknown,
      };
    } catch (error) {
      return { value: null, error };
    }
  }, [swapParamsQuery.data]);

  const stxAsset = assetMap[STX_TOKEN_ID] ?? null;
  const stxBalanceBaseUnits = stxAsset?.balanceBaseUnits ?? "0";
  const isSourceStx = sourceToken?.tokenId === STX_TOKEN_ID;
  const { data: walletFeeEstimations = [], isLoading: isLoadingWalletFee } =
    useFeeEstimation({
      contractAddress: parsedSwapContractCall.value?.contractAddress ?? "",
      contractName: parsedSwapContractCall.value?.contractName ?? "",
      functionName: parsedSwapContractCall.value?.functionName ?? "",
      functionArgs: parsedSwapContractCall.value?.functionArgs ?? [],
      postConditions: parsedSwapContractCall.value?.postConditions ?? [],
      network: selectedNetwork,
      enabled:
        open &&
        Boolean(parsedSwapContractCall.value) &&
        Boolean(sourceTokenId) &&
        Boolean(destinationTokenId),
    });

  const walletFeeMicroStx = useMemo(() => {
    if (walletFeeEstimations.length === 0) return undefined;
    if (selectedFeeOption === "low") return walletFeeEstimations[0]?.fee;
    if (selectedFeeOption === "standard") {
      return walletFeeEstimations[1]?.fee ?? walletFeeEstimations[0]?.fee;
    }
    if (selectedFeeOption === "high") {
      return walletFeeEstimations[2]?.fee ?? walletFeeEstimations[1]?.fee;
    }

    return undefined;
  }, [selectedFeeOption, walletFeeEstimations]);

  const isWalletFeeValid = walletFeeMicroStx !== undefined;

  const walletFeeLabel = useMemo(() => {
    if (walletFeeMicroStx === undefined) return "Calculating…";
    return `${formatMicroStx(walletFeeMicroStx)} STX`;
  }, [walletFeeMicroStx]);

  const walletFeeBaseUnits = useMemo(() => {
    if (walletFeeMicroStx === undefined) {
      return null;
    }

    return BigInt(Math.ceil(walletFeeMicroStx)).toString();
  }, [walletFeeMicroStx]);

  const maxWalletSpendBaseUnits = useMemo(() => {
    if (!sourceToken) {
      return "0";
    }

    if (!isSourceStx) {
      return sourceToken.balanceBaseUnits;
    }

    if (walletFeeBaseUnits === null) {
      return stxBalanceBaseUnits;
    }

    const spendable = BigInt(stxBalanceBaseUnits) - BigInt(walletFeeBaseUnits);

    return spendable > 0n ? spendable.toString() : "0";
  }, [isSourceStx, sourceToken, stxBalanceBaseUnits, walletFeeBaseUnits]);

  const hasEnoughStxForFee =
    walletFeeBaseUnits !== null &&
    compareBaseUnitAmounts(walletFeeBaseUnits, stxBalanceBaseUnits) <= 0;

  const hasSufficientWalletBalance = useMemo(() => {
    if (!sourceToken || !amountBaseUnits || !hasSufficientBalance) {
      return false;
    }

    if (!isWalletFeeValid || walletFeeBaseUnits === null) {
      return false;
    }

    if (isSourceStx) {
      return (
        compareBaseUnitAmounts(amountBaseUnits, maxWalletSpendBaseUnits) <= 0
      );
    }

    return hasEnoughStxForFee;
  }, [
    amountBaseUnits,
    hasEnoughStxForFee,
    hasSufficientBalance,
    isSourceStx,
    isWalletFeeValid,
    maxWalletSpendBaseUnits,
    sourceToken,
    walletFeeBaseUnits,
  ]);

  const minimumReceivedBaseUnits = useMemo(
    () =>
      getMinimumReceivedBaseUnits(
        swapParamsQuery.data?.contractCallParams,
        destinationToken?.token ?? null,
      ),
    [destinationToken?.token, swapParamsQuery.data?.contractCallParams],
  );

  const minimumReceivedLabel = useMemo(() => {
    if (!minimumReceivedBaseUnits || !destinationToken) return null;
    return baseUnitsToDisplayString(
      minimumReceivedBaseUnits,
      destinationToken.decimals,
    );
  }, [destinationToken, minimumReceivedBaseUnits]);

  const stepError = useMemo(() => {
    if (error) return getErrorMessage(error, "Can't load swap markets.");
    if (!stxAddress && !isLoading) return "Connect wallet to swap.";
    if (possiblePairsQuery.isError)
      return getErrorMessage(possiblePairsQuery.error, "Can't load pairs.");
    if (swapParamsQuery.isError)
      return getErrorMessage(swapParamsQuery.error, "Can't prepare swap.");
    if (parsedSwapContractCall.error)
      return getErrorMessage(
        parsedSwapContractCall.error,
        "Invalid swap data.",
      );
    return undefined;
  }, [
    error,
    isLoading,
    parsedSwapContractCall.error,
    possiblePairsQuery.error,
    possiblePairsQuery.isError,
    stxAddress,
    swapParamsQuery.error,
    swapParamsQuery.isError,
  ]);

  const destinationEmptyState = useMemo(() => {
    if (!sourceToken) return "Select a source token first";
    if (possiblePairsQuery.isFetching) return "Loading tokens...";
    if (!destinationAssets.length) return "No pairs available for this token";
    return "Select a destination token";
  }, [destinationAssets.length, possiblePairsQuery.isFetching, sourceToken]);

  const isQuoteLoading = swapParamsQuery.isFetching;
  const isPickerLoading =
    step === "picker-destination" && possiblePairsQuery.isFetching;
  const isAnyExecuting = isExecuting || isSubmittingSponsored || isPreparing;
  const hasFreshQuote =
    canRequestQuote &&
    hasCurrentAmountQuote &&
    !swapParamsQuery.isFetching &&
    Boolean(swapParamsQuery.data) &&
    Boolean(parsedSwapContractCall.value);
  const canContinue = hasFreshQuote && !isAnyExecuting && step === "form";
  const canSubmitBase = hasFreshQuote && !isAnyExecuting;
  const canSubmitSponsored = canSubmitBase;
  const canSubmitWallet =
    canSubmitBase && isWalletFeeValid && hasSufficientWalletBalance;
  const pickerTokens = step === "picker-source" ? assets : destinationAssets;
  const pickerSelectedTokenId =
    step === "picker-source" ? sourceTokenId : destinationTokenId;
  const pickerEmptyMessage =
    step === "picker-source" ? "No tokens available." : destinationEmptyState;

  const handleAmountChange = useCallback(
    (value: string) => setAmountInput(sanitizeDecimal(value, sourceDecimals)),
    [sourceDecimals],
  );

  const handlePickerSelect = useCallback(
    (token: SwapAsset) => {
      Keyboard.dismiss();
      requestAnimationFrame(() => {
        if (step === "picker-source") setSourceTokenId(token.tokenId);
        else setDestinationTokenId(token.tokenId);
        setStep("form");
      });
    },
    [step],
  );

  const handleFlip = useCallback(() => {
    if (!sourceTokenId || !destinationTokenId) return;
    setStep("form");
    setAmountInput(minimumReceivedLabel ?? amountInput);
    setSourceTokenId(destinationTokenId);
    setDestinationTokenId(sourceTokenId);
  }, [amountInput, destinationTokenId, minimumReceivedLabel, sourceTokenId]);

  const handleMax = useCallback(() => {
    if (!sourceToken) return;
    if (
      sourceToken.tokenId === STX_TOKEN_ID &&
      walletFeeMicroStx !== undefined
    ) {
      setAmountInput(
        baseUnitsToDisplayString(maxWalletSpendBaseUnits, sourceToken.decimals),
      );
      return;
    }
    setAmountInput(sourceToken.balanceDisplay);
  }, [maxWalletSpendBaseUnits, sourceToken, walletFeeMicroStx]);

  const handleConfirm = useCallback(async () => {
    if (!stxAddress || !sourceTokenId || !destinationTokenId || !amountInput)
      return;
    setIsPreparing(true);
    try {
      const swapParams = await prepareSwap({
        tokenInId: sourceTokenId,
        tokenOutId: destinationTokenId,
        amount: amountInput.trim(),
        senderAddress: stxAddress,
      });
      const txId = await executeSwap({
        swapParams,
        feeMicroStx: walletFeeMicroStx,
      });
      showMessage({
        message: "Swap submitted",
        description: txId,
        type: "success",
      });
      onClose();
    } catch (e) {
      showMessage({
        message: "Swap failed",
        description: getErrorMessage(e, "Unable to submit this swap."),
        type: "danger",
      });
    } finally {
      setIsPreparing(false);
    }
  }, [
    amountInput,
    destinationTokenId,
    executeSwap,
    onClose,
    prepareSwap,
    sourceTokenId,
    stxAddress,
    walletFeeMicroStx,
  ]);

  const handleSponsoredConfirm = useCallback(async () => {
    if (!stxAddress || !sourceTokenId || !destinationTokenId || !amountInput)
      return;
    setIsPreparing(true);
    try {
      const swapParams = await prepareSwap({
        tokenInId: sourceTokenId,
        tokenOutId: destinationTokenId,
        amount: amountInput.trim(),
        senderAddress: stxAddress,
      });
      await executeSwapSponsored({ swapParams });
      showMessage({
        message: "Swap queued",
        description: "Your swap will be broadcast shortly.",
        type: "success",
      });
      onClose();
    } catch (e) {
      showMessage({
        message: "Swap failed",
        description: getErrorMessage(e, "Unable to submit this swap."),
        type: "danger",
      });
    } finally {
      setIsPreparing(false);
    }
  }, [
    amountInput,
    destinationTokenId,
    executeSwapSponsored,
    onClose,
    prepareSwap,
    sourceTokenId,
    stxAddress,
  ]);

  const onDismiss = useCallback(() => {
    setStep("form");
    onClose();
  }, [onClose]);

  const onReview = useCallback(() => {
    if (swapParamsQuery.data) setStep("review");
  }, [swapParamsQuery.data]);

  const onOpenSourceSelector = useCallback(() => setStep("picker-source"), []);
  const onOpenDestinationSelector = useCallback(
    () => setStep("picker-destination"),
    [],
  );
  const onBack = useCallback(() => setStep("form"), []);

  return {
    step,
    sourceToken,
    destinationToken,
    destinationEmptyState,
    amountInput,
    minimumReceivedLabel,
    isLoading,
    isExecuting,
    isSubmittingSponsored,
    isQuoteLoading,
    stepError,
    canContinue,
    canSubmitSponsored,
    canSubmitWallet,
    selectedFeeOption,
    walletFeeLabel,
    isLoadingWalletFee,
    isPickerLoading,
    pickerTokens,
    pickerSelectedTokenId,
    pickerEmptyMessage,
    onAmountChange: handleAmountChange,
    onFeeOptionChange: setSelectedFeeOption,
    onFlip: handleFlip,
    onMax: handleMax,
    onPickerSelect: handlePickerSelect,
    onOpenSourceSelector,
    onOpenDestinationSelector,
    onBack,
    onReview,
    onConfirm: handleConfirm,
    onSponsoredConfirm: handleSponsoredConfirm,
    onDismiss,
  };
}
