export interface StackingPoolClientPort {
  delegationTotalRewards(
    address: string,
    startCycleId: number,
    endCycleId: number | null,
  ): Promise<number>;
  getRewardFolderRef(): Promise<string>;
}
