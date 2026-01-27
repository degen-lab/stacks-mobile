import { useState } from "react";

export function useEarnActions() {
  const [receiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [bridgeSheetOpen, setBridgeSheetOpen] = useState(false);

  const handleBuy = () => {
    // TODO: Navigate to buy crypto screen
    console.log("Buy action");
  };

  const handleSell = () => {
    // TODO: Navigate to sell crypto screen
    console.log("Sell action");
  };

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
