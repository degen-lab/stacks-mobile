
export interface IStackingPoolClient {
  delegationTotalRewards(address: string): Promise<number>;
}
