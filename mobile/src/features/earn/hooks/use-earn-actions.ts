import { useCallback, useState } from "react";
import { useTransak } from "@/features/transak/context/transak-context";

export function useEarnActions() {
  const [receiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [bridgeSheetOpen, setBridgeSheetOpen] = useState(false);
  const { openTransak } = useTransak();

  const handleBuy = useCallback(() => {
    openTransak("STX", "buy");
  }, [openTransak]);

  const handleSell = useCallback(() => {
    openTransak("STX", "sell");
  }, [openTransak]);

  const handleReceive = () => {
    setReceiveSheetOpen(true);
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
    handleReceive,
    handleSwap,
    handleBridge,
    receiveSheetOpen,
    setReceiveSheetOpen,
    bridgeSheetOpen,
    setBridgeSheetOpen,
  };
}

export type EarnActions = ReturnType<typeof useEarnActions>;
