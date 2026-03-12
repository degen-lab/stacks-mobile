import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable } from "react-native";
import { showMessage } from "react-native-flash-message";
import { Modal, Text } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { useBroadcastBitcoinTransaction } from "@/api/bitcoin";
import { fromSatsToBtc } from "@/lib/format/currency";
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
import { useTransfer } from "../hooks/use-transfer";
import { useSendFlow } from "../hooks/use-send-flow";
import type { TransferAsset, TransferSheetRequest } from "../types";

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
  const { selectedNetwork } = useSelectedNetwork();
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
  const [qrAsset, setQrAsset] = useState<TransferAsset | null>(null);
  const [qrAddress, setQrAddress] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasOpenedRef = useRef(false);
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

  const broadcastBitcoinTx = useBroadcastBitcoinTransaction(selectedNetwork);

  const btcFeeDisplay = useMemo(() => {
    if (!preparedBtcSend) return "0.00000000";
    return fromSatsToBtc(preparedBtcSend.feeSats).toFixed(8);
  }, [preparedBtcSend]);

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

    setQrAsset(null);
    setQrAddress(null);

    const nextMode = request?.mode ?? initialMode ?? "select";
    setMode(nextMode);
    if (nextMode === "send") {
      initialize(request?.send);
      return;
    }

    reset();
  }, [
    initialMode,
    initialize,
    open,
    request,
    requestVersion,
    reset,
    setMode,
  ]);

  const handleSelectMode = (selectedMode: "send" | "receive") => {
    setMode(selectedMode);
  };

  const handleSendTransaction = async () => {
    if (sendFlow.formData.asset !== "BTC") {
      showMessage({
        message: `${sendFlow.formData.asset} transfers are not available yet`,
        type: "warning",
      });
      return;
    }

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
  };

  const handleBack = () => {
    // If viewing QR code, go back to asset list
    if (qrAsset && qrAddress) {
      setQrAsset(null);
      setQrAddress(null);
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

  const handleShowQR = (asset: TransferAsset, address: string) => {
    setQrAsset(asset);
    setQrAddress(address);
  };

  const handleCloseQR = () => {
    setQrAsset(null);
    setQrAddress(null);
  };

  const getTitle = () => {
    if (qrAsset && qrAddress) {
      if (qrAsset === "STX") return "Stacks Address QR";
      if (qrAsset === "BTC") return "Bitcoin Address QR";
      if (qrAsset === "sBTC") return "sBTC Address QR";
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
    if (mode === "select") return undefined;
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
    if (qrAsset && qrAddress) {
      return (
        <QRCodeView
          asset={qrAsset}
          address={qrAddress}
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
            fee={sendFlow.formData.asset === "BTC" ? btcFeeDisplay : "0.001"}
            feeAsset={sendFlow.formData.asset === "BTC" ? "BTC" : "STX"}
            onConfirm={handleSendTransaction}
            onBack={sendFlow.previousStep}
            isLoading={broadcastBitcoinTx.isPending}
            confirmDisabled={
              sendFlow.formData.asset === "BTC"
                ? preparingBtcSend ||
                  !preparedBtcSend ||
                  broadcastBitcoinTx.isPending
                : false
            }
            error={
              preparedBtcSendError instanceof Error
                ? preparedBtcSendError.message
                : null
            }
            info={preparingBtcSend ? "Preparing Bitcoin transaction..." : null}
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
    if (qrAsset && qrAddress) return ["70%"];
    if (mode === "select") return ["40%"];
    if (mode === "receive") return ["40%"];
    if (mode === "send") {
      if (sendFlow.currentStep === "asset") return ["50%"];
      if (
        sendFlow.currentStep === "confirm" &&
        sendFlow.formData.asset === "BTC"
      )
        return ["70%"];
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
    >
      {renderContent()}
    </Modal>
  );
}
