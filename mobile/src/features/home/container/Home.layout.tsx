import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { Ref } from "react";
import { useColorScheme } from "nativewind";
import { useWindowDimensions } from "react-native";
import { View, Card, ScrollView } from "@/components/ui";
import InviteFriendCard from "../components/invite-friend";
import PortfolioSummary from "../components/portfolio";
import { EmptyWalletModal } from "../components/empty-wallet-modal";
import { EarnActionButtons } from "@/features/home/components/action-buttons";
import type { EarnQuickActions } from "@/features/earn/types";

type HomeScreenLayoutProps = {
  actions: EarnQuickActions;
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
  actions,
  navigateToPortfolio,
  navigateToPlay,
  navigateToReferral,
  emptyWalletModalRef,
  onBuyCrypto,
  onDepositCrypto,
}: HomeScreenLayoutProps) {
  const { colorScheme } = useColorScheme();
  const { width } = useWindowDimensions();
  const playSquareImage =
    colorScheme === "dark"
      ? require("@/assets/images/play-square-dark.svg")
      : require("@/assets/images/play-square.svg");
  const cardDescriptionClassName = width <= 380 ? "pr-4" : "pr-8";

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="pt-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <PortfolioSummary balance={usdBalance} onPress={navigateToPortfolio} />
        <View className="mt-11">
          <EarnActionButtons actions={actions} />
        </View>

        <View className="mt-8 flex-row gap-3">
          <View className="flex-1">
            <Card
              imageSource={playSquareImage}
              imageSize={{ width: 62, height: 62 }}
              title="Play & Earn"
              description="Score high and earn more points."
              descriptionClassName={cardDescriptionClassName}
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
              descriptionClassName={cardDescriptionClassName}
              imageClassName="mb-4"
              onPress={navigateToPortfolio}
            />
          </View>
        </View>

        <InviteFriendCard onPress={navigateToReferral} />
      </ScrollView>

      <EmptyWalletModal
        ref={emptyWalletModalRef}
        onBuyCrypto={onBuyCrypto}
        onDepositCrypto={onDepositCrypto}
      />
    </View>
  );
}
