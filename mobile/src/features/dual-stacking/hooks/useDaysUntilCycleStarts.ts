import {
  useCurrentBitcoinBlockHeight,
  useIsContractActive,
  useIsDistributionFinalizedForThisCycle,
} from "@/api/dual-stacking/contract/hooks";
import { useDualStackingDataWithLatestCycle } from "./useDualStackingData";
import { isInDistributionWindow, timeUntilBlock } from "@/lib/utils/time";

export function useDaysUntilCycleStarts() {
  const { dualStackingData, cycle, dualStackingDataLoading } =
    useDualStackingDataWithLatestCycle();
  const { data: btcNow, isLoading: isLoadingBtcNow } =
    useCurrentBitcoinBlockHeight();
  const {
    data: isRewardsDistributionFinalized,
    isLoading: isLoadingIsRewardsDistributionFinalized,
  } = useIsDistributionFinalizedForThisCycle();
  const { data: isContractActive } = useIsContractActive();

  if (!dualStackingData || cycle == null || btcNow == null) {
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

  const currentCycle = dualStackingData.find(
    (cycleData) => cycleData.cycle_id === cycle,
  );

  const current = dualStackingData[Number(cycle)];
  const blocksPerSnapshot = current?.blocks_per_snapshot ?? 0;
  const nextStart =
    Number(current?.next_cycle_bitcoin_height ?? 0) - Number(blocksPerSnapshot);

  const { timeUntil } = timeUntilBlock(Number(btcNow), nextStart);
  const isDistributingRewards = isInDistributionWindow(
    Number(btcNow),
    currentCycle?.buffer_start_block,
    currentCycle?.buffer_blocks,
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
