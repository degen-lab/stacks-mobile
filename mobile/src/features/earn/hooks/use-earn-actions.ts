import { useCallback, useState } from "react";
import { useTransak } from "@/features/transak/context/transak-context";
import { useTransferSheet } from "@/features/transfer";

export function useEarnActions() {
  const [bridgeSheetOpen, setBridgeSheetOpen] = useState(false);
  const { openTransak } = useTransak();
  const { openTransfer } = useTransferSheet();

  const handleBuy = useCallback(() => {
    openTransak("STX", "buy");
  }, [openTransak]);

  const handleSell = useCallback(() => {
    openTransak("STX", "sell");
  }, [openTransak]);

  const handleTransfer = useCallback(() => {
    openTransfer();
  }, [openTransfer]);

  const handleSwap = () => {
    // TODO: Navigate to swap screen
    console.log("Swap action");
  };

  const handleBridge = () => {
    setBridgeSheetOpen(true);
  };

  return {
    handleBuy,
    handleSell,
    handleTransfer,
    handleSwap,
    handleBridge,
    bridgeSheetOpen,
    setBridgeSheetOpen,
  };
}

export type EarnActions = ReturnType<typeof useEarnActions>;
