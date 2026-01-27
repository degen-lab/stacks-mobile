export type StackingInfo = {
  currentCycle: number;
  apy: number;
  price: number;
  nextCycleStart: Date;
};

export type StackingPosition = {
  isActive: boolean;
  lockedAmount: number;
  lockDuration: number; // in weeks
  lockStartAt: Date;
  lockEndAt: Date;
  nextUnlockCycle: number;
  nextUnlockDays: number;
  lifetimeEarnings: number;
  status: "ACTIVE" | "PENDING" | "UNLOCKING" | "ENDED";
  capabilities: {
    canIncrease: boolean;
    canDecrease: boolean;
    canExtend: boolean;
    canShorten: boolean;
    canLeave: boolean;
  };
};

export type UserStackingStats = {
  liquidBalance: number;
  lockedAmount: number;
  lockedAmountUsd: number;
  nextUnlockCycle: number;
  nextUnlockDays: number;
  lifetimeEarnings: number;
  activePosition?: StackingPosition;
};

export type CalculatorResults = {
  daily: number;
  monthly: number;
  yearly: number;
};
