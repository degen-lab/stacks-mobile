import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { View } from "@/components/ui";
import TopSectionContainer from "../components/cards/container/TopSection";
import EarnBtcContainer from "../components/earn-btc/EarnBtc";
import { Calculator } from "../components/calculator";
import { PortfolioPerformanceCardContainer } from "../components/rewards/portfolio/container";
import { CompositionCardContainer } from "../components/rewards/pie-chart/container";
import { RewardsCycleCardContainer } from "../components/rewards/cycle-tracker/container";

export default function DualStackingLayout() {
  return (
    <SafeAreaView className="bg-surface-tertiary" edges={["bottom"]}>
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24, gap: 24 }}
      >
        <TopSectionContainer />

        <EarnBtcContainer />

        <Calculator />

        <PortfolioPerformanceCardContainer />

        <CompositionCardContainer />

        <RewardsCycleCardContainer />

        <View className="py-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
