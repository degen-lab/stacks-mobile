import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, View } from "@/components/ui";
import { TokensList } from "@/features/earn/components/tokens/tokens-list";
import { EarnNextStepsSection } from "@/features/earn/components/next-step/earn-next-steps-section";
import { EarnOverviewCard } from "@/features/earn/components/portfolio/overview-card";
import type {
  EarnAssetSnapshot,
  EarnNextStepCard,
  EarnRewardRow,
} from "@/features/earn/types";

type EarnLayoutProps = {
  assets: EarnAssetSnapshot[];
  portfolioTotalUsd: number | null;
  rewardsTotalUsd: number | null;
  rewardRows: EarnRewardRow[];
  nextStepCards: EarnNextStepCard[];
  isLoading: boolean;
  isRewardsLoading: boolean;
  isNextStepsLoading: boolean;
  isBalanceVisible: boolean;
  onPressRewardRow: (row: EarnRewardRow) => void;
  onPressNextStepCard: (card: EarnNextStepCard) => void;
  onPressAsset: (asset: EarnAssetSnapshot) => void;
};

export default function EarnLayout({
  assets,
  portfolioTotalUsd,
  rewardsTotalUsd,
  rewardRows,
  nextStepCards,
  isLoading,
  isRewardsLoading,
  isNextStepsLoading,
  isBalanceVisible,
  onPressRewardRow,
  onPressNextStepCard,
  onPressAsset,
}: EarnLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-surface-tertiary" edges={[]}>
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 32, gap: 18 }}
      >
        <View
          testID="earn-portfolio-section"
          className="rounded-[20px] border border-surface-secondary bg-sand-50 px-4 py-4"
        >
          <EarnOverviewCard
            assets={assets}
            portfolioTotalUsd={portfolioTotalUsd}
            rewardsTotalUsd={rewardsTotalUsd}
            rewardRows={rewardRows}
            isLoading={isLoading}
            isRewardsLoading={isRewardsLoading}
            isBalanceVisible={isBalanceVisible}
            onPressRewardRow={onPressRewardRow}
            onPressAsset={onPressAsset}
          />
        </View>

        <EarnNextStepsSection
          cards={nextStepCards}
          isLoading={isNextStepsLoading}
          onPressCard={onPressNextStepCard}
        />

        <View testID="earn-assets-section" className="gap-3">
          <Text className="font-matter text-xl leading-6 tracking-tight text-primary">
            Your Assets
          </Text>

          <TokensList
            assets={assets}
            isLoading={isLoading}
            isBalanceVisible={isBalanceVisible}
            onPressAsset={onPressAsset}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
