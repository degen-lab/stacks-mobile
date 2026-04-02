import {
  useCurrentBitcoinBlockHeight,
  useIsContractActive,
  useIsDistributionFinalizedForThisCycle,
} from "@/api/dual-stacking/contract/hooks";
import { getLatestDualStackingCycleRow } from "@/api/dual-stacking/backend";
import { useDualStackingDataWithLatestCycle } from "./use-dual-stacking-data";
import { isInDistributionWindow, timeUntilBlock } from "@/lib/utils/time";

export function useDaysUntilCycleStarts() {
  const { dualStackingData, dualStackingDataLoading } =
    useDualStackingDataWithLatestCycle();
  const { data: btcNow, isLoading: isLoadingBtcNow } =
    useCurrentBitcoinBlockHeight();
  const {
    data: isRewardsDistributionFinalized,
    isLoading: isLoadingIsRewardsDistributionFinalized,
  } = useIsDistributionFinalizedForThisCycle();
  const { data: isContractActive } = useIsContractActive();

  if (
    !Array.isArray(dualStackingData) ||
    dualStackingData.length === 0 ||
    btcNow == null
  ) {
    return {
      loading: true,
      timeUntil: {
        days: 0,
        hours: 0,
        minutes: 0,
        totalDays: 0,
        totalHours: 0,
        totalMinutes: 0,
      },
      daysUntilCycleStart: 0,
      isFinalized: false,
      isDistributingRewards: false,
    };
  }

  const currentCycle = getLatestDualStackingCycleRow(dualStackingData);

  if (!currentCycle) {
    return {
      loading: true,
      timeUntil: {
        days: 0,
        hours: 0,
        minutes: 0,
        totalDays: 0,
        totalHours: 0,
        totalMinutes: 0,
      },
      daysUntilCycleStart: 0,
      isFinalized: false,
      isDistributingRewards: false,
    };
  }

  const blocksPerSnapshot = Number(currentCycle.blocks_per_snapshot ?? 0);
  const nextStart =
    Number(currentCycle.next_cycle_bitcoin_height ?? 0) - blocksPerSnapshot;

  const { timeUntil } = timeUntilBlock(Number(btcNow), nextStart);
  const bufferStart =
    currentCycle.buffer_start_block != null
      ? Number(currentCycle.buffer_start_block)
      : undefined;
  const bufferBlocks =
    currentCycle.buffer_blocks != null
      ? Number(currentCycle.buffer_blocks)
      : undefined;
  const isDistributingRewards = isInDistributionWindow(
    Number(btcNow),
    bufferStart,
    bufferBlocks,
  );
  const isYieldLoading = isContractActive ? dualStackingDataLoading : false;

  return {
    loading:
      isYieldLoading ||
      isLoadingBtcNow ||
      isLoadingIsRewardsDistributionFinalized,
    timeUntil,
    daysUntilCycleStart: timeUntil.days,
    isFinalized: Boolean(isRewardsDistributionFinalized),
    isDistributingRewards,
  };
}
