export interface LastCycleAprsResponse {
  cycle_id: number;
  max_defi_apr: string;
  base_apr: string;
  stacking_apr: string;
}

export type ProjectRewardsParams = {
  address: string;
  maxApr: number;
  stx?: bigint | number | string;
  sbtcWallet?: bigint | number | string;
  sbtcDefi?: bigint | number | string;
  whitelisted?: boolean;
};

export type ProjectRewardsResponse = {
  address: string;
  goldenRatio: string;
  weight: string;
  totalWeight: string;
  expectedAPR: string;
  expectedTotalApr?: string;
  expectedStackingApr?: string;
  minAPR?: string;
  baseAPR?: string;
  maxAPR?: string;
  expectedRewardsPercent: string;
  expectedUserRewards: string;
  expectedRewardsStacking?: string;
  expectedTotalRewards: string;
};
