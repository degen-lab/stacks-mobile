import SectionHeader from "../layout/section-header";
import { RewardsCycleCardContainer } from "./cycle-tracker/container";
import { CompositionCardContainer } from "./pie-chart/container";
import { PortfolioPerformanceCardContainer } from "./portfolio/container";
import { View } from "@/components/ui";

export function RewardsLayout() {
  return (
    <SectionHeader title="Portfolio">
      <View>
        <View className="mb-4">
          <PortfolioPerformanceCardContainer />
        </View>
        <View className="mb-4">
          <CompositionCardContainer />
        </View>
        <RewardsCycleCardContainer />
      </View>
    </SectionHeader>
  );
}
