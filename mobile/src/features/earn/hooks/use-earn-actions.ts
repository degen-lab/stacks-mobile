import { useCallback, useState } from "react";
import { useTransak } from "@/features/transak/context/transak-context";

export function useEarnActions() {
  const [transferSheetOpen, setTransferSheetOpen] = useState(false);
  const [bridgeSheetOpen, setBridgeSheetOpen] = useState(false);
  const { openTransak } = useTransak();

  const handleBuy = useCallback(() => {
    openTransak("STX", "buy");
  }, [openTransak]);

  const handleSell = useCallback(() => {
    openTransak("STX", "sell");
  }, [openTransak]);

  const handleTransfer = () => {
    setTransferSheetOpen(true);
  };

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
    transferSheetOpen,
    setTransferSheetOpen,
    bridgeSheetOpen,
    setBridgeSheetOpen,
  };
}

export type EarnActions = ReturnType<typeof useEarnActions>;
