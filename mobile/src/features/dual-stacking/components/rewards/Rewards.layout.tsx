import SectionHeader from "../layout/section-header";
import { RewardsCycleCardContainer } from "./cycle-tracker/container";
import { CompositionCardContainer } from "./pie-chart/container";
import { PortfolioPerformanceCardContainer } from "./portfolio/container";

export function RewardsLayout() {
  return (
    <SectionHeader title="Portfolio">
      <PortfolioPerformanceCardContainer />
      <CompositionCardContainer />
      <RewardsCycleCardContainer />
    </SectionHeader>
  );
}
