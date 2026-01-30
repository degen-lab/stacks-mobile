export type StackingPosition = {
  lockedAmount: number;
  lockDuration: number;
  nextUnlockDays?: number;
  status: "ACTIVE" | "PENDING" | "UNLOCKING" | "ENDED";
};
