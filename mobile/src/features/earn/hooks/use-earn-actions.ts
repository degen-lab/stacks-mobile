import { useCallback, useState } from "react";
import { useTransak } from "@/features/transak/context/transak-context";
import { useSwapSheet } from "@/features/swaps";
import { useTransferSheet } from "@/features/transfer";

export function useEarnActions() {
  const [bridgeSheetOpen, setBridgeSheetOpen] = useState(false);
  const { openTransak } = useTransak();
  const { openSwap } = useSwapSheet();
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

  const handleSwap = useCallback(() => {
    openSwap();
  }, [openSwap]);

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
