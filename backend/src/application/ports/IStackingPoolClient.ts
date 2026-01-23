
export interface IStackingPoolClient {
  delegationTotalRewards(address: string, startCycleId: number, endCycleId: number): Promise<number>;
}
