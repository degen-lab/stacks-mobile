import { useStacksPrice } from "@/api/market/use-stacks-price";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { RelativePathString, useRouter } from "expo-router";
import HomeScreenLayout from "./Home.layout";
import { useModal } from "@/components/ui";
import { useActiveAccountIndex } from "@/lib/store/settings";

export default function HomeScreen() {
  const { activeAccountIndex } = useActiveAccountIndex();
  const { balance: stxBalance } = useStxBalance(activeAccountIndex);
  const { data: stxPriceUsd } = useStacksPrice();
  const usdBalance = stxPriceUsd ? stxBalance * stxPriceUsd : 0;
  const emptyWalletModal = useModal();
  const router = useRouter();

  const navigateToPortfolio = () => {
    if (stxBalance > 0) {
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

  return (
    <HomeScreenLayout
      usdBalance={usdBalance}
      navigateToPortfolio={navigateToPortfolio}
      navigateToPlay={navigateToPlay}
      navigateToReferral={navigateToReferral}
      emptyWalletModalRef={emptyWalletModal.ref}
      onBuyCrypto={emptyWalletModal.dismiss}
      onDepositCrypto={emptyWalletModal.dismiss}
    />
  );
}
