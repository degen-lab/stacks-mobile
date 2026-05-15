import { RelativePathString, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { useModal } from "@/components/ui";
import { MintSbtcSheet } from "@/features/dual-stacking/components/layout/modals/mint-sbtc-sheet";
import { useSwapSheet } from "@/features/swaps";
import { useTransferSheet } from "@/features/transfer";
import { useTransak } from "@/features/transak/context/transak-context";
import { usePortfolioBalance } from "@/hooks/use-portfolio-balance";

import HomeScreenLayout from "./Home.layout";

export default function HomeScreen() {
  const { usdBalance, hasBalance } = usePortfolioBalance();
  const emptyWalletModal = useModal();
  const { openTransak } = useTransak();
  const { openSwap } = useSwapSheet();
  const { openTransfer } = useTransferSheet();
  const router = useRouter();

  const navigateToPortfolio = useCallback(() => {
    if (hasBalance) {
      router.push("/(app)/Earn" as RelativePathString);
      return;
    }
    emptyWalletModal.present();
  }, [emptyWalletModal, hasBalance, router]);

  const navigateToPlay = useCallback(() => {
    router.push("/(app)/Play" as RelativePathString);
  }, [router]);

  const navigateToReferral = useCallback(() => {
    router.push("/referral" as RelativePathString);
  }, [router]);

  const navigateToBuy = useCallback(() => {
    emptyWalletModal.dismiss();
    openTransak("STX", "buy");
  }, [emptyWalletModal, openTransak]);

  const handleDepositCrypto = useCallback(() => {
    emptyWalletModal.dismiss();
    openTransfer({ mode: "receive" });
  }, [emptyWalletModal, openTransfer]);

  const [isMintSbtcSheetOpen, setIsMintSbtcSheetOpen] = useState(false);

  const actions = useMemo(
    () => ({
      onBuy: () => openTransak("STX", "buy"),
      onTransfer: () => openTransfer(),
      onSwap: () => openSwap(),
      onBridge: () => setIsMintSbtcSheetOpen(true),
    }),
    [openSwap, openTransfer, openTransak],
  );

  return (
    <>
      <HomeScreenLayout
        usdBalance={usdBalance}
        actions={actions}
        navigateToPortfolio={navigateToPortfolio}
        navigateToPlay={navigateToPlay}
        navigateToReferral={navigateToReferral}
        emptyWalletModalRef={emptyWalletModal.ref}
        onBuyCrypto={navigateToBuy}
        onDepositCrypto={handleDepositCrypto}
      />
      <MintSbtcSheet
        open={isMintSbtcSheetOpen}
        onOpenChange={setIsMintSbtcSheetOpen}
      />
    </>
  );
}
