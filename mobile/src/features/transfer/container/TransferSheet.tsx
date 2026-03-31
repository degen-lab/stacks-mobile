import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native";
import { showMessage } from "react-native-flash-message";
import { Modal, Text, colors } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { useBroadcastBitcoinTransaction } from "@/api/bitcoin";
import { fromSatsToBtc, MICRO_STX } from "@/lib/format/currency";
import type { AppToken } from "@/lib/assets/tokens";
import { walletKit } from "@/lib/stacks/wallet";
import { useSelectedNetwork } from "@/lib/store/settings";
import { getBitcoinAddressError } from "@/lib/bitcoin/validation";
import { TransferModeSelector } from "../components/transfer-mode-selector";
import { ReceiveAssetList } from "../components/receive-asset-list";
import { QRCodeView } from "../components/qr-code-view";
import { AssetSelection } from "../components/send/asset-selection";
import { RecipientInput } from "../components/send/recipient-input";
import { AmountInput } from "../components/send/amount-input";
import { Confirmation } from "../components/send/confirmation";
import {
  usePrepareBtcSend,
  type FeeRateTier,
} from "../hooks/use-prepare-btc-send";
import { usePrepareStxSend } from "../hooks/use-prepare-stx-send";
import { usePrepareFtSend } from "../hooks/use-prepare-ft-send";
import { useTransfer } from "../hooks/use-transfer";
import { useSendFlow } from "../hooks/use-send-flow";
import type { TransferSheetRequest } from "../types";
import { useSponsoredStacksTransaction } from "@/hooks/use-sponsored-stacks-transaction";
import { useSignTransaction } from "@/hooks/use-sign-transaction";
import {
  buildUnsignedContractCall,
  buildUnsignedStxTransfer,
} from "@/lib/stacks/transaction-builder";
import { getActiveWalletAccount } from "@/lib/stacks/active-account";
import { CONTRACTS } from "@/lib/stacks/contracts";
import { getHiroApiBase } from "@/lib/stacks/network";
import {
  broadcastTransaction,
  deserializeTransaction,
  noneCV,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
} from "@stacks/transactions";
import { useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics";

type TransferSheetProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: "send" | "receive";
  request?: TransferSheetRequest;
  requestVersion?: number;
};

export function TransferSheet({
  open,
  onClose,
  initialMode,
  request,
  requestVersion,
}: TransferSheetProps) {
  const { ref, present, dismiss } = useModal();
  const queryClient = useQueryClient();
  const { selectedNetwork } = useSelectedNetwork();
  const { submitSponsoredTransaction, isSubmittingSponsored } =
    useSponsoredStacksTransaction();
  const signTransaction = useSignTransaction();
  const [isSubmittingWallet, setIsSubmittingWallet] = useState(false);
  const {
    mode,
    setMode,
    stxAddress,
    btcAddress,
    getCurrentBalance,
    getCurrentBalanceIsLoading,
  } = useTransfer();

  const sendFlow = useSendFlow();
  const { initialize, reset } = sendFlow;
  const [feeRateTier, setFeeRateTier] = useState<FeeRateTier>("standard");
  const [qrAsset, setQrAsset] = useState<AppToken | null>(null);
  const [qrAddress, setQrAddress] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasOpenedRef = useRef(false);
  const hasHandledRequestedReceiveRef = useRef(false);
  const currentAsset = sendFlow.formData.asset;
  const currentBalance = getCurrentBalance(currentAsset);
  const currentBalanceIsLoading = getCurrentBalanceIsLoading(currentAsset);
  const recipientError =
    mode === "send" &&
    sendFlow.currentStep !== "asset" &&
    currentAsset === "BTC"
      ? getBitcoinAddressError(sendFlow.formData.recipient, selectedNetwork)
      : !sendFlow.formData.recipient && sendFlow.currentStep === "recipient"
        ? "Recipient address is required"
        : null;

  const {
    data: preparedBtcSend,
    isLoading: preparingBtcSend,
    error: preparedBtcSendError,
  } = usePrepareBtcSend({
    recipient: sendFlow.formData.recipient,
    amount: sendFlow.formData.amount,
    feeRateTier,
    enabled:
      open &&
      mode === "send" &&
      sendFlow.currentStep === "confirm" &&
      currentAsset === "BTC",
  });

  const {
    data: preparedStxSend,
    isLoading: preparingStxSend,
    error: preparedStxSendError,
  } = usePrepareStxSend({
    recipient: sendFlow.formData.recipient,
    amount: sendFlow.formData.amount,
    network: selectedNetwork,
    enabled:
      open &&
      mode === "send" &&
      sendFlow.currentStep === "confirm" &&
      currentAsset === "STX",
  });

  const sbtcContractId = CONTRACTS[selectedNetwork].sbtc;
  const isSbtcAvailable = Boolean(sbtcContractId);
  const sendAssetAvailability = useMemo(
    () => ({
      sBTC: isSbtcAvailable
        ? { enabled: true }
        : { enabled: false, disabledLabel: "Unavailable" },
    }),
    [isSbtcAvailable],
  );
  const {
    data: preparedSbtcSend,
    isLoading: preparingSbtcSend,
    error: preparedSbtcSendError,
  } = usePrepareFtSend({
    contractId: sbtcContractId,
    recipient: sendFlow.formData.recipient,
    amount: sendFlow.formData.amount,
    decimals: 8,
    senderAddress: stxAddress ?? "",
    network: selectedNetwork,
    enabled:
      open &&
      mode === "send" &&
      sendFlow.currentStep === "confirm" &&
      currentAsset === "sBTC" &&
      isSbtcAvailable,
  });

  const broadcastBitcoinTx = useBroadcastBitcoinTransaction(selectedNetwork);

  const btcFeeDisplay = preparedBtcSend
    ? fromSatsToBtc(preparedBtcSend.feeSats).toFixed(8)
    : "0.00000000";
  const buildSbtcTransferArgs = useCallback(
    (amountSats: number, senderAddress: string, recipient: string) => [
      uintCV(amountSats),
      standardPrincipalCV(senderAddress),
      standardPrincipalCV(recipient),
      noneCV(),
    ],
    [],
  );
  const invalidateSbtcState = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["sbtc"] });
    void queryClient.invalidateQueries({
      queryKey: ["sbtc-bridge", "balance"],
    });
  }, [queryClient]);

  const getReceiveAddress = useCallback(
    (asset: AppToken | null | undefined) => {
      if (asset === "STX") return stxAddress;
      if (asset === "BTC") return btcAddress;
      if (asset === "sBTC") return stxAddress;
      return null;
    },
    [btcAddress, stxAddress],
  );
  const requestedReceiveAsset =
    request?.mode === "receive" ? (request.receive?.asset ?? null) : null;
  const requestedReceiveAddress = requestedReceiveAsset
    ? getReceiveAddress(requestedReceiveAsset)
    : null;
  const pendingRequestedReceiveQrAsset =
    open &&
    !qrAsset &&
    !qrAddress &&
    !hasHandledRequestedReceiveRef.current &&
    requestedReceiveAsset &&
    requestedReceiveAddress
      ? requestedReceiveAsset
      : null;
  const pendingRequestedReceiveQrAddress = pendingRequestedReceiveQrAsset
    ? requestedReceiveAddress
    : null;
  const activeQrAsset = qrAsset ?? pendingRequestedReceiveQrAsset;
  const activeQrAddress = qrAddress ?? pendingRequestedReceiveQrAddress;

  useEffect(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    if (open) {
      hasOpenedRef.current = true;
      present();
      return;
    }

    if (!hasOpenedRef.current) return;

    dismiss();
    hasOpenedRef.current = false;
    closeTimeoutRef.current = setTimeout(() => {
      setMode("select");
      reset();
      setQrAsset(null);
      setQrAddress(null);
      hasHandledRequestedReceiveRef.current = false;
      closeTimeoutRef.current = null;
    }, 300);

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [dismiss, open, present, reset, setMode]);

  useEffect(() => {
    if (!open) return;

    hasHandledRequestedReceiveRef.current = false;
    setQrAsset(null);
    setQrAddress(null);

    const nextMode = request?.mode ?? initialMode ?? "select";
    setMode(nextMode);
    if (nextMode === "send") {
      initialize(request?.send);
      return;
    }

    const requestedAsset =
      request?.mode === "receive" ? request.receive?.asset : null;
    const requestedAddress = getReceiveAddress(requestedAsset);

    if (requestedAsset && requestedAddress) {
      setQrAsset(requestedAsset);
      setQrAddress(requestedAddress);
      hasHandledRequestedReceiveRef.current = true;
    }

    reset();
  }, [
    getReceiveAddress,
    initialMode,
    initialize,
    open,
    request,
    requestVersion,
    reset,
    setMode,
  ]);

  useEffect(() => {
    if (
      !open ||
      mode !== "receive" ||
      qrAsset ||
      qrAddress ||
      hasHandledRequestedReceiveRef.current
    ) {
      return;
    }

    const requestedAsset =
      request?.mode === "receive" ? request.receive?.asset : null;
    if (!requestedAsset) return;

    const address = getReceiveAddress(requestedAsset);
    if (!address) return;

    setQrAsset(requestedAsset);
    setQrAddress(address);
    hasHandledRequestedReceiveRef.current = true;
  }, [
    getReceiveAddress,
    btcAddress,
    mode,
    open,
    qrAddress,
    qrAsset,
    request?.mode,
    request?.receive?.asset,
    stxAddress,
  ]);

  const handleSelectMode = (selectedMode: "send" | "receive") => {
    setMode(selectedMode);
  };

  const handleSendTransaction = async () => {
    const token = sendFlow.formData.asset;
    if (token) void trackEvent("transfer_initiated", { token });
    if (sendFlow.formData.asset === "BTC") {
      if (!preparedBtcSend) {
        showMessage({
          message: "Unable to prepare the Bitcoin transaction",
          description:
            preparedBtcSendError instanceof Error
              ? preparedBtcSendError.message
              : "Try again in a few seconds.",
          type: "danger",
        });
        return;
      }

      try {
        const txId = await broadcastBitcoinTx.mutateAsync(
          preparedBtcSend.rawTxHex,
        );
        void trackEvent("transfer_completed", {
          token: "BTC",
          method: "wallet",
        });
        showMessage({
          message: "Bitcoin transaction submitted",
          description: txId,
          type: "success",
        });
        onClose();
      } catch (error) {
        showMessage({
          message: "Bitcoin transaction failed",
          description: error instanceof Error ? error.message : String(error),
          type: "danger",
        });
      }
      return;
    }

    if (sendFlow.formData.asset === "sBTC") {
      if (!isSbtcAvailable) {
        showMessage({
          message: "sBTC transfers are unavailable on this network",
          type: "danger",
        });
        return;
      }

      if (!preparedSbtcSend) {
        showMessage({
          message: "Unable to estimate sBTC fee",
          description:
            preparedSbtcSendError instanceof Error
              ? preparedSbtcSendError.message
              : "Try again in a few seconds.",
          type: "danger",
        });
        return;
      }

      try {
        const amountSats = Math.round(
          (Number(sendFlow.formData.amount) || 0) * 1e8,
        );
        const { accountIndex, address } = await getActiveWalletAccount();
        setIsSubmittingWallet(true);
        const txid = await walletKit.makeContractCall(
          sbtcContractId,
          "transfer",
          buildSbtcTransferArgs(
            amountSats,
            address,
            sendFlow.formData.recipient,
          ),
          PostConditionMode.Allow,
          preparedSbtcSend.feeMicroStx,
          accountIndex,
        );
        if (!txid) {
          throw new Error("Unable to broadcast sBTC transaction.");
        }
        invalidateSbtcState();
        void trackEvent("transfer_completed", {
          token: "sBTC",
          method: "wallet",
        });
        showMessage({
          message: "sBTC transaction submitted",
          description: txid,
          type: "success",
        });
        onClose();
      } catch (error) {
        showMessage({
          message: "sBTC transaction failed",
          description: error instanceof Error ? error.message : String(error),
          type: "danger",
        });
      } finally {
        setIsSubmittingWallet(false);
      }
      return;
    }

    if (!preparedStxSend) {
      showMessage({
        message: "Unable to estimate STX fee",
        description:
          preparedStxSendError instanceof Error
            ? preparedStxSendError.message
            : "Try again in a few seconds.",
        type: "danger",
      });
      return;
    }

    try {
      const amountMicroStx = Math.round(
        (Number(sendFlow.formData.amount) || 0) * MICRO_STX,
      );
      const { account, accountIndex } = await getActiveWalletAccount();
      setIsSubmittingWallet(true);
      const unsignedSerializedTx = await buildUnsignedStxTransfer({
        recipient: sendFlow.formData.recipient,
        amountMicroStx,
        network: selectedNetwork,
        publicKey: account.publicKey,
        memo: sendFlow.formData.memo || undefined,
        feeMicroStx: preparedStxSend.feeMicroStx,
      });
      const signedTxHex = await signTransaction(
        unsignedSerializedTx,
        accountIndex,
      );
      const txHex = signedTxHex.startsWith("0x")
        ? signedTxHex.slice(2)
        : signedTxHex;
      const response = await broadcastTransaction({
        transaction: deserializeTransaction(txHex),
        client: { baseUrl: getHiroApiBase(selectedNetwork) },
      });
      const broadcastFailure = response as {
        error?: string;
        reason?: string;
      };

      if ("error" in broadcastFailure) {
        throw new Error(
          broadcastFailure.reason ??
            broadcastFailure.error ??
            "Unable to broadcast STX transaction",
        );
      }

      void queryClient.invalidateQueries({
        queryKey: ["stacks-user-balances"],
      });
      void trackEvent("transfer_completed", { token: "STX", method: "wallet" });
      showMessage({
        message: "STX transaction submitted",
        description: response.txid,
        type: "success",
      });
      onClose();
    } catch (error) {
      showMessage({
        message: "STX transaction failed",
        description: error instanceof Error ? error.message : String(error),
        type: "danger",
      });
    } finally {
      setIsSubmittingWallet(false);
    }
  };

  const handleSponsoredSendTransaction = async () => {
    const token = sendFlow.formData.asset;
    if (token !== "STX" && token !== "sBTC") return;
    void trackEvent("transfer_initiated", { token });

    try {
      if (token === "sBTC") {
        if (!isSbtcAvailable) {
          showMessage({
            message: "sBTC transfers are unavailable on this network",
            type: "danger",
          });
          return;
        }

        if (!preparedSbtcSend) {
          showMessage({
            message: "Unable to estimate sBTC fee",
            description:
              preparedSbtcSendError instanceof Error
                ? preparedSbtcSendError.message
                : "Try again in a few seconds.",
            type: "danger",
          });
          return;
        }

        const amountSats = Math.round(
          (Number(sendFlow.formData.amount) || 0) * 1e8,
        );
        const { account, accountIndex, address } =
          await getActiveWalletAccount();
        const unsignedSerializedTx = await buildUnsignedContractCall({
          contractId: sbtcContractId,
          functionName: "transfer",
          functionArgs: buildSbtcTransferArgs(
            amountSats,
            address,
            sendFlow.formData.recipient,
          ),
          network: selectedNetwork,
          publicKey: account.publicKey,
          feeMicroStx: preparedSbtcSend.feeMicroStx,
          sponsored: true,
          postConditionMode: PostConditionMode.Allow,
        });

        await submitSponsoredTransaction({
          originAddress: address,
          accountIndex,
          unsignedSerializedTx,
        });

        invalidateSbtcState();
        void trackEvent("transfer_completed", {
          token: "sBTC",
          method: "sponsored",
        });
        showMessage({
          message: "sBTC transfer queued",
          description: "Your sponsored transfer will be broadcast shortly.",
          type: "success",
        });
        onClose();
        return;
      }

      const amountMicroStx = Math.round(
        (Number(sendFlow.formData.amount) || 0) * MICRO_STX,
      );
      const { account, accountIndex, address } = await getActiveWalletAccount();
      const unsignedSerializedTx = await buildUnsignedStxTransfer({
        recipient: sendFlow.formData.recipient,
        amountMicroStx,
        network: selectedNetwork,
        publicKey: account.publicKey,
        memo: sendFlow.formData.memo || undefined,
        feeMicroStx: preparedStxSend?.feeMicroStx ?? 1000,
        sponsored: true,
      });

      await submitSponsoredTransaction({
        originAddress: address,
        accountIndex,
        unsignedSerializedTx,
      });

      void queryClient.invalidateQueries({
        queryKey: ["stacks-user-balances"],
      });
      void trackEvent("transfer_completed", {
        token: "STX",
        method: "sponsored",
      });
      showMessage({
        message: "STX transfer queued",
        description: "Your sponsored transfer will be broadcast shortly.",
        type: "success",
      });
      onClose();
    } catch (error) {
      showMessage({
        message: "Sponsored transfer failed",
        description: error instanceof Error ? error.message : String(error),
        type: "danger",
      });
    }
  };

  const handleBack = () => {
    // If viewing QR code, go back to asset list
    if (activeQrAsset && activeQrAddress) {
      hasHandledRequestedReceiveRef.current = true;
      setQrAsset(null);
      setQrAddress(null);
      if (!qrAsset && !qrAddress) {
        setMode("receive");
      }
      return;
    }

    if (mode === "send") {
      if (sendFlow.currentStep === "asset") {
        setMode("select");
        sendFlow.reset();
      } else if (sendFlow.currentStep === "amount") {
        if (sendFlow.locks.asset) {
          setMode("select");
          sendFlow.reset();
        } else {
          sendFlow.previousStep();
        }
      } else {
        sendFlow.previousStep();
      }
    } else if (mode === "receive") {
      setMode("select");
    }
  };

  const handleShowQR = (asset: AppToken, address: string) => {
    setQrAsset(asset);
    setQrAddress(address);
  };

  const handleCloseQR = () => {
    hasHandledRequestedReceiveRef.current = true;
    setQrAsset(null);
    setQrAddress(null);
    if (!qrAsset && !qrAddress) {
      setMode("receive");
    }
  };

  const getTitle = () => {
    if (activeQrAsset && activeQrAddress) {
      if (activeQrAsset === "STX") return "Stacks Address QR";
      if (activeQrAsset === "BTC") return "Bitcoin Address QR";
      if (activeQrAsset === "sBTC") return "sBTC Address QR";
      return "QR Code";
    }
    if (mode === "select") return "Transfer";
    if (mode === "send") {
      const asset = sendFlow.formData.asset;
      switch (sendFlow.currentStep) {
        case "asset":
          return "Select Asset";
        default:
          return asset ? `Send ${asset}` : "Send";
      }
    }
    return "Receive";
  };

  const getBackButton = () => {
    if (mode === "select" && !(activeQrAsset && activeQrAddress)) {
      return undefined;
    }
    return (
      <Pressable
        onPress={handleBack}
        className="px-4 py-2"
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
      >
        <Text className="text-2xl text-primary">←</Text>
      </Pressable>
    );
  };

  const renderContent = () => {
    // Show QR code view if asset and address are selected
    if (activeQrAsset && activeQrAddress) {
      return (
        <QRCodeView
          asset={activeQrAsset}
          address={activeQrAddress}
          onClose={handleCloseQR}
        />
      );
    }

    if (mode === "select") {
      return <TransferModeSelector onSelectMode={handleSelectMode} />;
    }

    if (mode === "receive") {
      return (
        <ReceiveAssetList
          stxAddress={stxAddress}
          btcAddress={btcAddress}
          onShowQR={handleShowQR}
        />
      );
    }

    switch (sendFlow.currentStep) {
      case "asset":
        return (
          <AssetSelection
            onSelectAsset={sendFlow.updateAsset}
            onNext={sendFlow.nextStep}
            assetAvailability={sendAssetAvailability}
          />
        );
      case "amount":
        return (
          <AmountInput
            asset={sendFlow.formData.asset}
            amount={sendFlow.formData.amount}
            balance={currentBalance}
            balanceIsLoading={currentBalanceIsLoading}
            onAmountChange={sendFlow.updateAmount}
            onNext={sendFlow.nextStep}
            onBack={sendFlow.previousStep}
            isLocked={sendFlow.locks.amount}
          />
        );
      case "recipient":
        return (
          <RecipientInput
            asset={sendFlow.formData.asset}
            recipient={sendFlow.formData.recipient}
            memo={sendFlow.formData.memo || ""}
            onRecipientChange={sendFlow.updateRecipient}
            onMemoChange={sendFlow.updateMemo}
            onNext={sendFlow.nextStep}
            onBack={sendFlow.previousStep}
            recipientError={recipientError}
            recipientLocked={sendFlow.locks.recipient}
            memoLocked={sendFlow.locks.memo}
          />
        );
      case "confirm":
        return (
          <Confirmation
            formData={sendFlow.formData}
            fee={
              sendFlow.formData.asset === "BTC"
                ? btcFeeDisplay
                : sendFlow.formData.asset === "sBTC"
                  ? (preparedSbtcSend?.feeDisplay ?? "...")
                  : (preparedStxSend?.feeDisplay ?? "...")
            }
            feeAsset={sendFlow.formData.asset === "BTC" ? "BTC" : "STX"}
            onConfirm={handleSendTransaction}
            onConfirmSponsored={
              sendFlow.formData.asset === "STX" ||
              sendFlow.formData.asset === "sBTC"
                ? handleSponsoredSendTransaction
                : undefined
            }
            onBack={sendFlow.previousStep}
            isLoading={
              sendFlow.formData.asset === "BTC"
                ? broadcastBitcoinTx.isPending
                : isSubmittingWallet
            }
            isSponsoredLoading={isSubmittingSponsored}
            confirmDisabled={
              sendFlow.formData.asset === "BTC"
                ? preparingBtcSend ||
                  !preparedBtcSend ||
                  broadcastBitcoinTx.isPending
                : sendFlow.formData.asset === "sBTC"
                  ? preparingSbtcSend || !preparedSbtcSend || isSubmittingWallet
                  : preparingStxSend ||
                    !preparedStxSend ||
                    isSubmittingWallet ||
                    isSubmittingSponsored
            }
            error={
              sendFlow.formData.asset === "sBTC" && !isSbtcAvailable
                ? "sBTC transfers are unavailable on this network."
                : preparedBtcSendError instanceof Error
                  ? preparedBtcSendError.message
                  : preparedSbtcSendError instanceof Error
                    ? preparedSbtcSendError.message
                    : preparedStxSendError instanceof Error
                      ? preparedStxSendError.message
                      : null
            }
            info={
              preparingBtcSend
                ? "Preparing Bitcoin transaction..."
                : preparingSbtcSend
                  ? "Estimating sBTC fee..."
                  : preparingStxSend
                    ? "Estimating STX fee..."
                    : null
            }
            feeRateTier={
              sendFlow.formData.asset === "BTC" ? feeRateTier : undefined
            }
            feeRatePerVbyte={preparedBtcSend?.feeRate}
            onFeeRateTierChange={
              sendFlow.formData.asset === "BTC" ? setFeeRateTier : undefined
            }
          />
        );
    }
  };

  const getSnapPoints = () => {
    if (activeQrAsset && activeQrAddress) return ["70%"];
    if (mode === "select") return ["40%"];
    if (mode === "receive") return ["40%"];
    if (mode === "send") {
      if (sendFlow.currentStep === "asset") return ["50%"];
      if (sendFlow.currentStep === "confirm") {
        if (sendFlow.formData.asset === "BTC") return ["70%"];
        return ["75%"]; // STX confirm has two buttons (wallet + watch ad) + divider
      }
      return ["65%"];
    }
    return ["60%"];
  };

  return (
    <Modal
      ref={ref}
      snapPoints={getSnapPoints()}
      title={getTitle()}
      headerLeft={getBackButton()}
      onDismiss={onClose}
      enablePanDownToClose={mode === "select"}
      backgroundStyle={{ backgroundColor: colors.neutral[50] }}
    >
      {renderContent()}
    </Modal>
  );
}
