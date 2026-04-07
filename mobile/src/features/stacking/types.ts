export type StackingPosition = {
  lockedAmount: number;
  lockDuration: number;
  status: "ACTIVE" | "PENDING" | "UNLOCKING" | "ENDED";
  // Backend details
  poolName?: string;
  rewardedStxAmount?: number | null;
};
