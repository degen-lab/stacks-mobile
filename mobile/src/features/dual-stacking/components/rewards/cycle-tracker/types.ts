export type RewardsCycle = {
  cycleNumber: number;
  progress: number;
  startsInDays: number;
  participants: number;
  isFinalized: boolean;
  isContractActive: boolean;
  isDistributingRewards: boolean;
  totalSbtcParticipating: number;
  totalUsdValue: number;
};
