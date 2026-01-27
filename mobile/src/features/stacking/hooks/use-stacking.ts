import { useMemo } from "react";
import { useStacksPrice } from "@/api/market/use-stacks-price";
import { useStxBalance } from "@/hooks/use-stx-balance";
import type {
  StackingInfo,
  UserStackingStats,
  CalculatorResults,
} from "../types";

const MOCK_STACKING_INFO: StackingInfo = {
  currentCycle: 77,
  apy: 0.1,
  price: 0.31,
  nextCycleStart: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
};

export function useStacking() {
  const { balance, isLoading: isBalanceLoading } = useStxBalance();
  const { data: stxPrice, isLoading: isPriceLoading } = useStacksPrice();

  const stackingInfo: StackingInfo = useMemo(
    () => ({
      ...MOCK_STACKING_INFO,
      price: stxPrice ? stxPrice : MOCK_STACKING_INFO.price,
    }),
    [stxPrice],
  );

  const userStats: UserStackingStats = useMemo(
    () => ({
      liquidBalance: balance,
      lockedAmount: 0, // Mock value
      lockedAmountUsd: 0,
      nextUnlockCycle: 79,
      nextUnlockDays: 28,
      lifetimeEarnings: 0,
      activePosition: {
        isActive: true,
        lockedAmount: 60, // 40 STX locked
        lockDuration: 12, // 12 weeks
        lockStartAt: new Date(),
        lockEndAt: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000),
        nextUnlockCycle: 79,
        nextUnlockDays: 28,
        lifetimeEarnings: 0.0012,
        status: "ACTIVE",
        capabilities: {
          canIncrease: true,
          canDecrease: false, // Decreasing unsupported in preview
          canExtend: true,
          canShorten: false, // Shortening unsupported
          canLeave: false,
        },
      },
    }),
    [balance],
  );

  const isStacking = !!userStats?.activePosition?.isActive;

  const calculate = useMemo(
    () =>
      (amount: number, cycles: number): CalculatorResults | null => {
        if (!amount || amount < 40) return null;

        const apy = stackingInfo.apy;
        return {
          daily: (amount * apy) / 365,
          monthly: ((amount * apy) / 365) * 30,
          yearly: amount * apy,
        };
      },
    [stackingInfo],
  );

  return {
    stackingInfo,
    userStats,
    isStacking,
    calculate,
  };
}
