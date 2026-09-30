import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { useBridgeLimits } from "@/api/sbtc-bridge/hooks";
import { useCurrentTournamentSubmissions } from "@/api/game/tournament";
import { useBridgeConfig } from "@/features/sbtc-bridge/hooks/use-bridge-data";
import { useTransferSheet } from "@/features/transfer";
import { useTransak } from "@/features/transak/context/transak-context";
import { usePortfolioBalance } from "@/hooks/use-portfolio-balance";
import { fromSatsToBtc } from "@/lib/format/currency";
import { useBalanceVisibility } from "@/lib/store/balance-visibility";
import {
  PENDING_GAME_SUBMISSION_TTL_MS,
  usePendingGameSubmissionStore,
} from "@/lib/store/pending-game-submission";

import { GetAssetSheet } from "@/features/transfer/components/get-asset-sheet";
import { useUserStackingData } from "@/api/stacking";
import { usePoxData } from "@/api/stacks/use-stacks-api";
import { useUserProfile } from "@/api/user";
import { useTimeTillRewards } from "@/features/stacking/hooks/use-cycle-time";
import { DEFAULT_STACKING_APY } from "@/features/stacking/hooks/use-stacking";
import { buildEarnAssetRoute } from "../lib/asset-route";
import { buildEarnNextStepCards } from "../lib/next-steps";
import {
  EARN_REWARD_ROW_ROUTES,
  buildEarnRewardsSummary,
} from "../lib/rewards";
import type {
  EarnAcquisitionAsset,
  EarnNextStepCard,
  EarnRewardRow,
} from "../types";

import EarnLayout from "./Earn.layout";

const EARN_NEXT_STEP_ROUTES = {
  bridge: "/Earn/sbtc-bridge",
  stacking: "/Earn/stacking",
} as const;

export default function EarnScreen() {
  const router = useRouter();
  const { openTransak } = useTransak();
  const { openTransfer } = useTransferSheet();
  const { isBalanceVisible } = useBalanceVisibility();
  const { data: userProfile } = useUserProfile();
  const [selectedGetAsset, setSelectedGetAsset] =
    useState<EarnAcquisitionAsset | null>(null);
  const pendingSubmission = usePendingGameSubmissionStore(
    (state) => state.pendingSubmission,
  );
  const clearPendingSubmission = usePendingGameSubmissionStore(
    (state) => state.clearPendingSubmission,
  );

  const bridgeConfig = useBridgeConfig();
  const bridgeLimits = useBridgeLimits(bridgeConfig);
  const portfolio = usePortfolioBalance();
  const { data: poxInfo, isLoading: isLoadingPox } = usePoxData();
  const { data: userStackingData = [], isLoading: isUserStackingDataLoading } =
    useUserStackingData({
      variables: { userId: userProfile?.id ?? 0 },
      enabled: !!userProfile?.id,
    });
  const {
    data: currentTournamentSubmissions,
    isLoading: currentTournamentSubmissionsLoading,
  } = useCurrentTournamentSubmissions({
    refetchInterval: pendingSubmission ? 10_000 : false,
    refetchOnWindowFocus: true,
  });
  const { timeTillRewardPhase } = useTimeTillRewards(poxInfo);
  const nextRewardPhaseLabel =
    timeTillRewardPhase && timeTillRewardPhase !== "--"
      ? timeTillRewardPhase
      : null;
  const serverSubmissionCount =
    (currentTournamentSubmissions?.weeklyContestSubmissionsForCurrentTournament
      ?.length ?? 0) +
    (currentTournamentSubmissions?.raffleSubmissionsForCurrentTournament
      ?.length ?? 0);
  const pendingSubmissionExpired =
    pendingSubmission != null &&
    Date.now() - pendingSubmission.createdAt > PENDING_GAME_SUBMISSION_TTL_MS;
  const optimisticPendingSubmissionCount =
    pendingSubmission &&
    !pendingSubmissionExpired &&
    serverSubmissionCount <= pendingSubmission.baselineCount
      ? 1
      : 0;
  const currentTournamentGameSubmissionCount =
    serverSubmissionCount + optimisticPendingSubmissionCount;
  const bridgeDepositMinimumBtc = fromSatsToBtc(
    bridgeLimits.data?.perDepositMinimum ?? 0,
  );

  useEffect(() => {
    if (!pendingSubmission) return;
    if (
      pendingSubmissionExpired ||
      serverSubmissionCount > pendingSubmission.baselineCount
    ) {
      clearPendingSubmission();
    }
  }, [
    clearPendingSubmission,
    pendingSubmission,
    pendingSubmissionExpired,
    serverSubmissionCount,
  ]);

  const assets = portfolio.assets;
  const isPortfolioInitialLoading =
    portfolio.isBalanceLoading && assets.length === 0;

  const rewardsSummary = useMemo(
    () =>
      buildEarnRewardsSummary({
        stackingRows: userStackingData,
        currentStxPriceUsd: portfolio.stxPriceUsd ?? null,
        currentStackingApr: DEFAULT_STACKING_APY * 100,
        lockedStxBalance: portfolio.stxLockedBalance,
        currentTournamentGameSubmissionCount,
      }),
    [
      currentTournamentGameSubmissionCount,
      portfolio.stxLockedBalance,
      portfolio.stxPriceUsd,
      userStackingData,
    ],
  );

  const nextStepCards = useMemo(
    () =>
      buildEarnNextStepCards({
        btcBalance: portfolio.btcBalanceOrNull,
        bridgeDepositMinimumBtc,
        sbtcBalance: portfolio.sbtcBalance,
        totalStxBalance: portfolio.stxBalance,
        availableStxBalance: portfolio.stxAvailableBalance,
        lockedStxBalance: portfolio.stxLockedBalance,
        nextRewardPhaseLabel,
        stackingApr: rewardsSummary.currentStackingApr,
      }),
    [
      bridgeDepositMinimumBtc,
      portfolio.btcBalanceOrNull,
      portfolio.sbtcBalance,
      portfolio.stxAvailableBalance,
      portfolio.stxBalance,
      portfolio.stxLockedBalance,
      nextRewardPhaseLabel,
      rewardsSummary.currentStackingApr,
    ],
  );

  const isNextStepsLoading =
    portfolio.isNextStepsBalanceLoading ||
    bridgeLimits.isLoading ||
    isLoadingPox;

  const isRewardsLoading =
    isNextStepsLoading ||
    currentTournamentSubmissionsLoading ||
    isUserStackingDataLoading;
  const portfolioTotalUsd = portfolio.usdBalanceOrNull;

  const handleBuyAsset = useCallback(
    (asset: EarnAcquisitionAsset) => {
      openTransak(asset, "buy");
    },
    [openTransak],
  );

  const handleReceiveAsset = useCallback(
    (asset: EarnAcquisitionAsset) => {
      openTransfer({
        mode: "receive",
        receive: { asset },
      });
    },
    [openTransfer],
  );

  const handlePressRewardRow = useCallback(
    (row: EarnRewardRow) => {
      router.navigate(EARN_REWARD_ROW_ROUTES[row.id] as never);
    },
    [router],
  );

  const handlePressAsset = useCallback(
    (asset: (typeof assets)[number]) => {
      router.navigate(buildEarnAssetRoute(asset) as never);
    },
    [router],
  );

  const handlePressNextStepCard = useCallback(
    (card: EarnNextStepCard) => {
      if (card.action.type === "acquire") {
        setSelectedGetAsset(card.action.asset);
        return;
      }

      if (card.action.type === "none") return;

      router.push(EARN_NEXT_STEP_ROUTES[card.action.type]);
    },
    [router],
  );

  return (
    <>
      <EarnLayout
        assets={assets}
        portfolioTotalUsd={portfolioTotalUsd}
        rewardsTotalUsd={rewardsSummary.totalRewardsUsd}
        rewardRows={rewardsSummary.rows}
        nextStepCards={nextStepCards}
        isLoading={isPortfolioInitialLoading}
        isRewardsLoading={isRewardsLoading}
        isNextStepsLoading={isNextStepsLoading}
        isBalanceVisible={isBalanceVisible}
        onPressRewardRow={handlePressRewardRow}
        onPressNextStepCard={handlePressNextStepCard}
        onPressAsset={handlePressAsset}
      />
      <GetAssetSheet
        open={selectedGetAsset !== null}
        asset={selectedGetAsset}
        onClose={() => setSelectedGetAsset(null)}
        onBuy={handleBuyAsset}
        onReceive={handleReceiveAsset}
      />
    </>
  );
}
