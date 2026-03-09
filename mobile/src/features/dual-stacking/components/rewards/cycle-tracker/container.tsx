import {
  useCurrentBitcoinBlockHeight,
  useIsContractActive,
} from "@/api/dual-stacking/contract/hooks";
import { useTotalSbtcEnrolled } from "@/api/dual-stacking";
import { useCoinPricesForYield } from "@/features/dual-stacking/hooks/useCoinPricesForYield";
import { useDaysUntilCycleStarts } from "@/features/dual-stacking/hooks/useDaysUntilCycleStarts";
import { useDualStackingDataWithLatestCycle } from "@/features/dual-stacking/hooks/useDualStackingData";
import { fromSatsToBtc } from "@/lib/format/currency";
import { isInDistributionWindow } from "@/lib/utils/time";
import { RewardsCycleCard } from "./RewardsCycleCard";
import { RewardsCycleCardSkeleton } from "./RewardsCycleCard.skeleton";

const HIRO_SBTC_EXPLORER_URL =
  "https://explorer.hiro.so/token/SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token?chain=mainnet";
const UNINITIALIZED_CONTRACT_START_BLOCK = 921465;

export function RewardsCycleCardContainer() {
  const {
    dualStackingData,
    cycle,
    dualStackingDataLoading,
    dualStackingDataError,
  } = useDualStackingDataWithLatestCycle();
  const {
    data: currentBitcoinBlockHeight,
    isLoading: loadingCurrentBitcoinBlockHeight,
    isError: currentBitcoinBlockHeightError,
  } = useCurrentBitcoinBlockHeight();
  const {
    data: isContractActiveData,
    isLoading: loadingContractActive,
    isError: contractActiveError,
  } = useIsContractActive();
  const {
    data: totalSbtcEnrolled,
    isLoading: loadingTotalSbtcEnrolled,
    isError: totalSbtcEnrolledError,
  } = useTotalSbtcEnrolled();
  const {
    raw: coinPrices,
    isLoading: loadingCoinPrices,
    isError: coinPricesError,
  } = useCoinPricesForYield();
  const {
    daysUntilCycleStart,
    isFinalized,
    loading: loadingCycleStartState,
  } = useDaysUntilCycleStarts();

  const isContractActive = Boolean(isContractActiveData);
  const initializedCycle = isContractActive ? (cycle ?? 0) : 0;
  const currentCycleData = dualStackingData?.find(
    (item) => item.cycle_id === initializedCycle,
  );

  const isError =
    dualStackingDataError ||
    currentBitcoinBlockHeightError ||
    contractActiveError ||
    totalSbtcEnrolledError ||
    coinPricesError;

  if (isError) {
    return null;
  }

  const isLoading =
    dualStackingDataLoading ||
    loadingCurrentBitcoinBlockHeight ||
    loadingContractActive ||
    loadingTotalSbtcEnrolled ||
    loadingCoinPrices ||
    loadingCycleStartState;

  if (isLoading) {
    return <RewardsCycleCardSkeleton />;
  }

  if (currentBitcoinBlockHeight == null || !currentCycleData) {
    return null;
  }

  const btcPrice = Number(coinPrices?.latest_prices?.btc_price ?? 0);
  const blocksPerSnapshot = Number(currentCycleData.blocks_per_snapshot ?? 0);
  const currentStart = isContractActive
    ? Number(currentCycleData.current_cycle_bitcoin_height ?? 0)
    : UNINITIALIZED_CONTRACT_START_BLOCK;
  const nextStart = isContractActive
    ? Number(currentCycleData.next_cycle_bitcoin_height ?? 0)
    : Number(currentCycleData.current_cycle_bitcoin_height ?? 0);
  const blocksPerCycle = isContractActive
    ? blocksPerSnapshot * Number(currentCycleData.snapshots_per_cycle ?? 0)
    : nextStart - currentStart;
  const btcNow = Number(currentBitcoinBlockHeight);

  const isDistributingRewards =
    Boolean(isContractActiveData) && currentBitcoinBlockHeight != null
      ? isInDistributionWindow(
          btcNow,
          currentCycleData.buffer_start_block,
          currentCycleData.buffer_blocks,
        )
      : false;
  const progressedBlocks = Math.max(
    0,
    Math.min(blocksPerCycle, btcNow - currentStart),
  );
  const progressPct =
    blocksPerCycle > 0
      ? Math.round((progressedBlocks / blocksPerCycle) * 100)
      : 0;

  const totalSbtcParticipating = isContractActive
    ? fromSatsToBtc(Number(totalSbtcEnrolled?.total ?? 0))
    : 0;
  const totalUsdValue = totalSbtcParticipating * btcPrice;
  const participants = isContractActive
    ? Number(currentCycleData.participants_count ?? 0)
    : 0;

  const blocksUntilRewards = Math.max(0, blocksPerCycle - progressedBlocks);
  const daysUntilCycleStartWhenContractIsNotActive = Math.ceil(
    blocksUntilRewards / 144,
  );
  const cycleData = {
    cycleNumber: Number(initializedCycle),
    progress: progressPct,
    startsInDays: isContractActive
      ? daysUntilCycleStart
      : daysUntilCycleStartWhenContractIsNotActive,
    isFinalized,
    isContractActive,
    isDistributingRewards,
    participants,
    totalSbtcParticipating,
    totalUsdValue,
  };

  return <RewardsCycleCard cycle={cycleData} href={HIRO_SBTC_EXPLORER_URL} />;
}
