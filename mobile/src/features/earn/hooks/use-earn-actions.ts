import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useTransak } from "@/features/transak/context/transak-context";
import { useSwapSheet } from "@/features/swaps";
import { useTransferSheet } from "@/features/transfer";

export function useEarnActions() {
  const router = useRouter();
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

  const handleBridge = useCallback(() => {
    router.push("/Earn/sbtc-bridge");
  }, [router]);

  return {
    handleBuy,
    handleSell,
    handleTransfer,
    handleSwap,
    handleBridge,
  };
}

export type EarnActions = ReturnType<typeof useEarnActions>;
