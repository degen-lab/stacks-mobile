import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { useDualStackingStats } from "@/api/dual-stacking/use-dual-stacking-stats";
import { useCurrentTournamentSubmissions } from "@/api/game/tournament";
import { useEnrollmentStatus } from "@/features/dual-stacking/hooks/use-enrollment-status";
import { useCoinPricesForYield } from "@/features/dual-stacking/hooks/use-coin-prices-for-yield";
import { useDualStackingDataWithLatestCycle } from "@/features/dual-stacking/hooks/use-dual-stacking-data";
import { useTransferSheet } from "@/features/transfer";
import { useTransak } from "@/features/transak/context/transak-context";
import { usePortfolioBalance } from "@/hooks/use-portfolio-balance";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useBalanceVisibility } from "@/lib/store/balance-visibility";

import { GetAssetSheet } from "@/features/transfer/components/get-asset-sheet";
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
  "dual-stacking": "/Earn/dual-stacking",
} as const;

export default function EarnScreen() {
  const router = useRouter();
  const { openTransak } = useTransak();
  const { openTransfer } = useTransferSheet();
  const { isBalanceVisible } = useBalanceVisibility();
  const [selectedGetAsset, setSelectedGetAsset] =
    useState<EarnAcquisitionAsset | null>(null);

  const portfolio = usePortfolioBalance();
  const {
    enrolledCurrentCycle,
    enrolledNextCycle,
    isLoading: enrollmentLoading,
  } = useEnrollmentStatus();
  const { stxAddress } = useWalletAddresses();
  const { dualStackingData, dualStackingDataLoading } =
    useDualStackingDataWithLatestCycle();
  const latestPricesQuery = useCoinPricesForYield();
  const dualStackingStatsQuery = useDualStackingStats({
    variables: { address: stxAddress ?? "" },
    enabled: !!stxAddress,
  });
  const {
    data: currentTournamentSubmissions,
    isLoading: currentTournamentSubmissionsLoading,
  } = useCurrentTournamentSubmissions();
  const isDualStackingStatsLoading = Boolean(
    stxAddress && dualStackingStatsQuery.isLoading,
  );
  const hasActiveGameSubmission =
    (currentTournamentSubmissions?.weeklyContestSubmissionsForCurrentTournament
      ?.length ?? 0) > 0;

  const assets = portfolio.assets;

  const rewardsSummary = useMemo(
    () =>
      buildEarnRewardsSummary({
        stats: dualStackingStatsQuery.data,
        dualStackingData,
        currentBtcPriceUsd:
          latestPricesQuery.data?.btc_price ?? portfolio.btcPriceUsd ?? null,
        currentStackingApr: latestPricesQuery.data?.stacking_apr ?? null,
        isEnrolledCurrentCycle: enrolledCurrentCycle,
        isEnrolledNextCycle: enrolledNextCycle,
        lockedStxBalance: portfolio.stxLockedBalance,
        hasActiveGameSubmission,
      }),
    [
      dualStackingData,
      dualStackingStatsQuery.data,
      enrolledCurrentCycle,
      hasActiveGameSubmission,
      enrolledNextCycle,
      latestPricesQuery.data?.btc_price,
      latestPricesQuery.data?.stacking_apr,
      portfolio.btcPriceUsd,
      portfolio.stxLockedBalance,
    ],
  );

  const nextStepCards = useMemo(
    () =>
      buildEarnNextStepCards({
        btcBalance: portfolio.btcBalance,
        sbtcBalance: portfolio.sbtcBalance + portfolio.sbtcDefiBalance,
        totalStxBalance: portfolio.stxBalance,
        availableStxBalance: portfolio.stxAvailableBalance,
        lockedStxBalance: portfolio.stxLockedBalance,
        isEnrolledCurrentCycle: enrolledCurrentCycle,
        isEnrolledNextCycle: enrolledNextCycle,
        nextRewardDateLabel: rewardsSummary.nextRewardDateLabel,
        stackingApr: rewardsSummary.currentStackingApr,
      }),
    [
      enrolledCurrentCycle,
      enrolledNextCycle,
      portfolio.btcBalance,
      portfolio.sbtcBalance,
      portfolio.sbtcDefiBalance,
      portfolio.stxAvailableBalance,
      portfolio.stxBalance,
      portfolio.stxLockedBalance,
      rewardsSummary.currentStackingApr,
      rewardsSummary.nextRewardDateLabel,
    ],
  );

  const isNextStepsLoading =
    portfolio.isBalanceLoading ||
    portfolio.isPriceLoading ||
    dualStackingDataLoading ||
    latestPricesQuery.isLoading ||
    isDualStackingStatsLoading ||
    enrollmentLoading;

  const isRewardsLoading =
    isNextStepsLoading || currentTournamentSubmissionsLoading;
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
      router.push(buildEarnAssetRoute(asset));
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
        isLoading={portfolio.isLoading}
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
