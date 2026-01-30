import { useMemo } from "react";
import { useStacksPrice } from "@/api/market/use-stacks-price";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { usePoxData } from "@/api/stacks/use-stacks-api";
import { useTimeTillRewards } from "./use-time-till-rewards";

const DEFAULT_APY = 0.1;
const AVERAGE_BLOCK_TIME_SECONDS = 10 * 60;

export function useStacking() {
  const { balance } = useStxBalance();
  const { data: stxPrice } = useStacksPrice();
  const { data: poxInfo, isLoading: isLoadingPox } = usePoxData();
  const { nextCycleDate, timeTillNextCycle } = useTimeTillRewards(poxInfo);

  const daysPerCycle = useMemo(() => {
    if (!poxInfo) return 0;
    return Math.round(
      (poxInfo.reward_cycle_length * AVERAGE_BLOCK_TIME_SECONDS) / (24 * 3600),
    );
  }, [poxInfo]);

  const stackingInfo = useMemo(
    () => ({
      currentCycle: poxInfo?.current_cycle.id ?? 0,
      apy: DEFAULT_APY,
      price: stxPrice ?? 0,
      nextCycleStart: nextCycleDate ?? new Date(),
      timeTillNextCycle,
    }),
    [poxInfo, stxPrice, nextCycleDate, timeTillNextCycle],
  );

  const calculate = useMemo(
    () => (amount: number) => {
      if (!amount) return null;

      const apy = stackingInfo.apy;
      return {
        daily: (amount * apy) / 365,
        monthly: ((amount * apy) / 365) * 30,
        yearly: amount * apy,
      };
    },
    [stackingInfo.apy],
  );

  return {
    balance,
    stackingInfo,
    daysPerCycle,
    calculate,
    isLoading: isLoadingPox,
  };
}
