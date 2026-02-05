import { useEffect, useState, useRef } from "react";
import { Pressable } from "react-native";
import { Modal, Text } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { TransferModeSelector } from "../components/transfer-mode-selector";
import { ReceiveAssetList } from "../components/receive-asset-list";
import { QRCodeView } from "../components/qr-code-view";
import { AssetSelection } from "../components/send/asset-selection";
import { RecipientInput } from "../components/send/recipient-input";
import { AmountInput } from "../components/send/amount-input";
import { Confirmation } from "../components/send/confirmation";
import { useTransfer } from "../hooks/use-transfer";
import { useSendFlow } from "../hooks/use-send-flow";
import type { TransferAsset } from "../types";

type TransferSheetProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: "send" | "receive";
};

export function TransferSheet({
  open,
  onClose,
  initialMode,
}: TransferSheetProps) {
  const { ref, present, dismiss } = useModal();
  const {
    mode,
    setMode,
    stxAddress,
    btcAddress,
    currentBalance,
    currentBalanceIsLoading,
  } = useTransfer();

  const sendFlow = useSendFlow();
  const [qrAsset, setQrAsset] = useState<TransferAsset | null>(null);
  const [qrAddress, setQrAddress] = useState<string | null>(null);
  const hasSetInitialMode = useRef(false);

  useEffect(() => {
    if (open) {
      present();
      // Set initial mode only once when sheet opens
      if (initialMode && !hasSetInitialMode.current) {
        setMode(initialMode);
        hasSetInitialMode.current = true;
      }
    } else {
      dismiss();
      // Reset on close
      setTimeout(() => {
        setMode("select");
        sendFlow.reset();
        setQrAsset(null);
        setQrAddress(null);
        hasSetInitialMode.current = false;
      }, 300);
    }
  }, [open, present, dismiss, initialMode, setMode, sendFlow]);

  const handleSelectMode = (selectedMode: "send" | "receive") => {
    setMode(selectedMode);
  };

  const handleSendTransaction = async () => {
    // TODO: Implement actual send logic
    console.log("Sending transaction:", sendFlow.formData);
    onClose();
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
        // If on asset selection, go back to mode selector
        setMode("select");
        sendFlow.reset();
      } else if (sendFlow.currentStep === "amount") {
        // If on amount, go back to asset selection
        sendFlow.previousStep();
      } else {
        // For other steps, go back normally
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
        case "amount":
          return asset ? `Send ${asset}` : "Send";
        case "recipient":
          return asset ? `Send ${asset}` : "Send";
        case "confirm":
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
            // selectedAsset={sendFlow.fsormData.asset}
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
          />
        );
      case "confirm":
        return (
          <Confirmation
            formData={sendFlow.formData}
            fee="0.001" // TODO: Calculate actual fee
            onConfirm={handleSendTransaction}
            onBack={sendFlow.previousStep}
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
      if (sendFlow.currentStep === "amount") return ["65%"];
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
