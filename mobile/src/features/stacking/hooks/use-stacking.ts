import { useMemo } from "react";
import { useStacksPrice } from "@/api/market/use-stacks-price";
import { usePoxData } from "@/api/stacks/use-stacks-api";
import { useTimeTillRewards } from "./use-cycle-time";
import { AVERAGE_BLOCK_DURATION_SECONDS } from "@/lib/format/date";

const DEFAULT_APY = 0.07;

export function useStacking() {
  const { data: stxPrice } = useStacksPrice();
  const { data: poxInfo, isLoading: isLoadingPox } = usePoxData();
  const {
    nextCycleDate,
    timeTillNextCycle,
    nextRewardPhaseDate,
    timeTillRewardPhase,
    inPreparePhase,
    timeTillPreparePhase,
  } = useTimeTillRewards(poxInfo);

  const daysPerCycle = useMemo(() => {
    if (!poxInfo) return 0;
    return Math.round(
      (poxInfo.reward_cycle_length * AVERAGE_BLOCK_DURATION_SECONDS) /
        (24 * 3600),
    );
  }, [poxInfo]);

  const stackingInfo = useMemo(
    () => ({
      currentCycle: poxInfo?.current_cycle.id ?? 0,
      apy: DEFAULT_APY,
      price: stxPrice ?? 0,
      nextCycleStart: nextCycleDate ?? new Date(),
      timeTillNextCycle,
      nextRewardPhaseDate,
      timeTillRewardPhase,
      inPreparePhase,
      timeTillPreparePhase,
    }),
    [
      poxInfo,
      stxPrice,
      nextCycleDate,
      timeTillNextCycle,
      nextRewardPhaseDate,
      timeTillRewardPhase,
      inPreparePhase,
      timeTillPreparePhase,
    ],
  );

  const calculate = useMemo(
    () => (amount: number) => {
      if (!amount) return null;

      const apy = stackingInfo.apy;
      return {
        daily: (amount * apy) / 365,
        weekly: ((amount * apy) / 365) * 7,
        monthly: ((amount * apy) / 365) * 30,
        yearly: amount * apy,
      };
    },
    [stackingInfo.apy],
  );

  return {
    stackingInfo,
    daysPerCycle,
    calculate,
    isLoading: isLoadingPox,
  };
}
