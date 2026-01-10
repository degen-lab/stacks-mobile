import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { Ref } from "react";
import { View, Card } from "@/components/ui";
import InviteFriendCard from "../components/invite-friend";
import PortfolioSummary from "../components/Portfolio";
import { EmptyWalletModal } from "../components/empty-wallet-modal";

type HomeScreenLayoutProps = {
  usdBalance: number;
  navigateToPortfolio: () => void;
  navigateToPlay: () => void;
  navigateToReferral: () => void;
  emptyWalletModalRef: Ref<BottomSheetModal>;
  onBuyCrypto: () => void;
  onDepositCrypto: () => void;
};

export default function HomeScreenLayout({
  usdBalance,
  navigateToPortfolio,
  navigateToPlay,
  navigateToReferral,
  emptyWalletModalRef,
  onBuyCrypto,
  onDepositCrypto,
}: HomeScreenLayoutProps) {
  return (
    <View className="flex-1 px-4 pt-6 bg-surface-tertiary">
      <PortfolioSummary balance={usdBalance} onPress={navigateToPortfolio} />
      <View className="mt-10 flex-row gap-3">
        <View className="flex-1">
          <Card
            imageSource={require("@/assets/images/play-square.svg")}
            imageSize={{ width: 62, height: 62 }}
            title="Play & earn"
            description="Score high, win the weekly pool."
            imageClassName="mb-4"
            onPress={navigateToPlay}
          />
        </View>
        <View className="flex-1">
          <Card
            imageSource={require("@/assets/images/stx-bitcoin.svg")}
            imageSize={{ width: 105, height: 62 }}
            title="Grow Portfolio"
            description="Let your money earn for you."
            imageClassName="mb-4"
            onPress={navigateToPortfolio}
          />
        </View>
      </View>
      <InviteFriendCard onPress={navigateToReferral} />
      <EmptyWalletModal
        ref={emptyWalletModalRef}
        onBuyCrypto={onBuyCrypto}
        onDepositCrypto={onDepositCrypto}
      />
    </View>
  );
}
