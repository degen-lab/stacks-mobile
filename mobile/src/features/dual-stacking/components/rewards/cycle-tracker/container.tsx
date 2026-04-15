import { useCurrentBitcoinBlockHeight } from "@/api/dual-stacking/contract/hooks";
import { useDualStackingData, useTotalSbtcEnrolled } from "@/api/dual-stacking";
import { getLatestDualStackingCycleRow } from "@/api/dual-stacking/backend";
import type { DualStackingDataCycleRow } from "@/api/dual-stacking/types";
import { useCoinPricesForYield } from "@/features/dual-stacking/hooks/use-coin-prices-for-yield";
import { useDaysUntilCycleStarts } from "@/features/dual-stacking/hooks/use-days-until-cycle-starts";
import { fromSatsToBtc } from "@/lib/format/currency";
import { isInDistributionWindow } from "@/lib/utils/time";
import { RewardsCycleCard } from "./RewardsCycleCard";
import { RewardsCycleCardSkeleton } from "./RewardsCycleCard.skeleton";

const HIRO_SBTC_EXPLORER_URL =
  "https://explorer.hiro.so/token/SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token?chain=mainnet";

export function RewardsCycleCardContainer() {
  const { data: dualStackingData, isLoading: dualStackingDataLoading } =
    useDualStackingData();
  const {
    data: currentBitcoinBlockHeight,
    isLoading: loadingCurrentBitcoinBlockHeight,
  } = useCurrentBitcoinBlockHeight();
  const { data: totalSbtcEnrolled, isLoading: loadingTotalSbtcEnrolled } =
    useTotalSbtcEnrolled();
  const { data: coinPrices, isLoading: loadingCoinPrices } =
    useCoinPricesForYield();
  const {
    daysUntilCycleStart,
    isFinalized,
    loading: loadingCycleStartState,
  } = useDaysUntilCycleStarts();

  const waitingForYield = dualStackingDataLoading && !dualStackingData;
  const btcReady =
    currentBitcoinBlockHeight !== undefined &&
    currentBitcoinBlockHeight !== null;

  if (
    waitingForYield ||
    !Array.isArray(dualStackingData) ||
    dualStackingData.length === 0 ||
    !btcReady
  ) {
    return <RewardsCycleCardSkeleton />;
  }

  const latest = getLatestDualStackingCycleRow(dualStackingData);

  if (!latest) {
    return <RewardsCycleCardSkeleton />;
  }

  const isLoading =
    loadingCurrentBitcoinBlockHeight ||
    loadingTotalSbtcEnrolled ||
    loadingCoinPrices ||
    loadingCycleStartState;

  if (isLoading) {
    return <RewardsCycleCardSkeleton />;
  }

  const btcPrice = Number(coinPrices?.btc_price ?? 0);
  const row = latest as DualStackingDataCycleRow;
  const btcNow = Number(currentBitcoinBlockHeight);
  const cycleStartBtc = Number(row.current_cycle_bitcoin_height ?? NaN);
  const currentCycleLive =
    Number.isFinite(btcNow) &&
    Number.isFinite(cycleStartBtc) &&
    btcNow >= cycleStartBtc;

  const totalSatsParticipating = totalSbtcEnrolled
    ? totalSbtcEnrolled.total
    : 0;
  const totalSbtcParticipating = currentCycleLive
    ? fromSatsToBtc(totalSatsParticipating)
    : 0;

  const blocksPerSnapshot = Number(row.blocks_per_snapshot ?? 0);
  const snapshotsPerCycle = Number(row.snapshots_per_cycle ?? 0);
  const currentStart = Number(row.current_cycle_bitcoin_height ?? 0);
  const nextStart = Number(row.next_cycle_bitcoin_height ?? 0);
  const bufferStart =
    row.buffer_start_block != null ? Number(row.buffer_start_block) : undefined;
  const bufferBlocks =
    row.buffer_blocks != null ? Number(row.buffer_blocks) : 0;

  const blocksPerCycle =
    blocksPerSnapshot > 0 && snapshotsPerCycle > 0
      ? blocksPerSnapshot * snapshotsPerCycle + bufferBlocks
      : Math.max(0, nextStart - currentStart);

  const isDistributingRewards =
    currentCycleLive && Number.isFinite(btcNow)
      ? isInDistributionWindow(btcNow, bufferStart, bufferBlocks)
      : false;
  const progressedBlocks = Math.max(
    0,
    Math.min(blocksPerCycle, btcNow - currentStart),
  );
  const progressPct =
    blocksPerCycle > 0 && Number.isFinite(progressedBlocks)
      ? Math.round((progressedBlocks / blocksPerCycle) * 100)
      : 0;

  const totalUsdValue = totalSbtcParticipating * btcPrice;
  const participants = currentCycleLive
    ? Number(row.participants_count ?? 0)
    : 0;

  let cycleStartsIn = 0;
  if (
    Number.isFinite(btcNow) &&
    Number.isFinite(cycleStartBtc) &&
    btcNow < cycleStartBtc
  ) {
    cycleStartsIn = Math.max(0, Math.ceil((cycleStartBtc - btcNow) / 144));
  } else if (currentCycleLive) {
    cycleStartsIn = daysUntilCycleStart;
  }

  const cycleData = {
    cycleNumber: Number(row.cycle_id),
    progress: progressPct,
    startsInDays: Number.isFinite(cycleStartsIn) ? cycleStartsIn : 0,
    isFinalized,
    isContractActive: currentCycleLive,
    isDistributingRewards,
    participants,
    totalSbtcParticipating,
    totalUsdValue,
  };

  return <RewardsCycleCard cycle={cycleData} href={HIRO_SBTC_EXPLORER_URL} />;
}
