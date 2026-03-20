import { RelativePathString, useRouter } from "expo-router";
import { useModal } from "@/components/ui";
import { useEarnActions } from "@/features/earn/hooks/use-earn-actions";
import { useTransferSheet } from "@/features/transfer";
import { useTransak } from "@/features/transak/context/transak-context";
import { usePortfolioBalance } from "@/hooks/use-portfolio-balance";

import HomeScreenLayout from "./Home.layout";

export default function HomeScreen() {
  const actions = useEarnActions();
  const { usdBalance, hasBalance } = usePortfolioBalance();
  const emptyWalletModal = useModal();
  const { openTransak } = useTransak();
  const { openTransfer } = useTransferSheet();
  const router = useRouter();

  const navigateToPortfolio = () => {
    if (hasBalance) {
      router.push("/(app)/Earn" as RelativePathString);
      return;
    }
    emptyWalletModal.present();
  };

  const navigateToPlay = () => {
    router.push("/(app)/Play" as RelativePathString);
  };

  const navigateToReferral = () => {
    router.push("/referral" as RelativePathString);
  };

  const navigateToBuy = () => {
    emptyWalletModal.dismiss();
    openTransak("STX", "buy");
  };

  const handleDepositCrypto = () => {
    emptyWalletModal.dismiss();
    openTransfer({ mode: "receive" });
  };

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
    </>
  );
}
