import { View } from "react-native";
import { Card } from "@/components/ui";
import InviteFriendCard from "../components/invite-friend";
import PortfolioSummary from "../components/portfolio";

type HomeScreenLayoutProps = {
  usdBalance: number;
  navigateToPortfolio: () => void;
  navigateToPlay: () => void;
  navigateToEarn: () => void;
  navigateToReferral: () => void;
};

export default function HomeScreenLayout({
  usdBalance,
  navigateToPortfolio,
  navigateToPlay,
  navigateToEarn,
  navigateToReferral,
}: HomeScreenLayoutProps & {
  usdBalance: number;
  navigateToPortfolio: () => void;
  navigateToPlay: () => void;
  navigateToEarn: () => void;
  navigateToReferral: () => void;
}) {
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
            title="Grow Portofolio"
            description="Let your money earn for you."
            imageClassName="mb-4"
            onPress={navigateToEarn}
          />
        </View>
      </View>
      <InviteFriendCard onPress={navigateToReferral} />
    </View>
  );
}
