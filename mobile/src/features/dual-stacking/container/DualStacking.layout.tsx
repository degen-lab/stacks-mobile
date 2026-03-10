import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { View } from "@/components/ui";
import { useSectionScroll } from "@/lib/utils/use-section-scroll";
import TopSectionContainer from "../components/cards/container/TopSection";
import EarnBtcContainer from "../components/earn-btc/EarnBtc";
import DeFiApps from "../components/defi-apps-native/DeFiApps";
import { Calculator } from "../components/calculator";
import { PortfolioPerformanceCardContainer } from "../components/rewards/portfolio/container";
import { CompositionCardContainer } from "../components/rewards/pie-chart/container";
import { RewardsCycleCardContainer } from "../components/rewards/cycle-tracker/container";

type DualStackingSectionId = "defi-apps";

export default function DualStackingLayout() {
  const { scrollViewRef, registerSection, scrollToSection } =
    useSectionScroll<DualStackingSectionId>({
      defaultOffset: 12,
    });

  return (
    <SafeAreaView className="bg-surface-tertiary" edges={["bottom"]}>
      <ScrollView
        ref={scrollViewRef}
        className="px-4"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24, gap: 24 }}
      >
        <TopSectionContainer />

        <EarnBtcContainer onExploreApps={() => scrollToSection("defi-apps")} />

        <Calculator />

        <PortfolioPerformanceCardContainer />

        <CompositionCardContainer />

        <RewardsCycleCardContainer />

        <DeFiApps onLayout={registerSection("defi-apps")} />

        <View className="py-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
