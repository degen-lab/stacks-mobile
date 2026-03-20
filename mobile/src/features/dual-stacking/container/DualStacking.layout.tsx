import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { View } from "@/components/ui";
import { useSectionScroll } from "@/lib/utils/use-section-scroll";
import TopSectionContainer from "../components/cards/container/TopSection";
import EarnBtcContainer from "../components/earn-btc/EarnBtc";
import DeFiApps from "../components/defi-apps/DeFiApps";
import { Calculator } from "../components/calculator";
import { RewardsLayout } from "../components/rewards/Rewards.layout";

class EarnBtcErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; retryCount: number }
> {
  state = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn(
      "[EarnBtc] Navigation context error — retrying. Cause:",
      error.message,
      "\nComponent stack:",
      info.componentStack,
    );
    setTimeout(
      () =>
        this.setState((s) => ({
          hasError: false,
          retryCount: s.retryCount + 1,
        })),
      50,
    );
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

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

        <EarnBtcErrorBoundary>
          <EarnBtcContainer
            onExploreApps={() => scrollToSection("defi-apps")}
          />
        </EarnBtcErrorBoundary>

        <Calculator />
        {isEnrolledNextCycle ? <RewardsLayout /> : null}
        <DeFiApps onLayout={registerSection("defi-apps")} />

        <View className="py-4" />
      </ScrollView>
    </SafeAreaView>
  );
}
