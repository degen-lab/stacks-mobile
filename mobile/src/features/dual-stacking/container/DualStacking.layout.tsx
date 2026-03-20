import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { View } from "@/components/ui";
import { useSectionScroll } from "@/lib/utils/use-section-scroll";
import TopSectionContainer from "../components/cards/container/TopSection";
import EarnBtcContainer from "../components/earn-btc/EarnBtc";
import DeFiApps from "../components/defi-apps/DeFiApps";
import { Calculator } from "../components/calculator";
import { RewardsLayout } from "../components/rewards/Rewards.layout";

type DualStackingSectionId = "defi-apps";

export default function DualStackingLayout({
  isEnrolledNextCycle,
}: {
  isEnrolledNextCycle: boolean;
}) {
  const { scrollViewRef, registerSection, scrollToSection } =
    useSectionScroll<DualStackingSectionId>({
      defaultOffset: 12,
    });

  return (
    <SafeAreaView className="flex-1 bg-surface-tertiary" edges={[]}>
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 12, gap: 24 }}
      >
        <TopSectionContainer />

        <EarnBtcContainer onExploreApps={() => scrollToSection("defi-apps")} />

        <Calculator />
        {isEnrolledNextCycle ? <RewardsLayout /> : null}
        <DeFiApps onLayout={registerSection("defi-apps")} />

        <View className="py-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
