// Dual Stacking Stats
export interface DualStackingStat {
  cycleId: number;
  rewardedSbtc: number | null;
  rewardedStacking: string | null;
  weight: number | null;
  ratio: number | null;
  baseApr: number | string | null;
  boostedApr: number | string | null;
  totalApr: number | string | null;
  stackingApr: number | string | null;
  rewardAddress: string | null;
  sbtcWalletSnapshots: number[];
  sbtcDefiSnapshots: number[];
  sbtcTotalSnapshots: number[];
  stxSnapshots: number[];
  snapshotsPerCycle: number;
  blocksPerSnapshot: number;
}

export type DualStackingStatsResponse = DualStackingStat[];

export interface DualStackingDataCycleRow {
  cycle_id: number;
  current_cycle_bitcoin_height?: number | string | null;
  next_cycle_bitcoin_height?: number | string | null;
  participants_count?: number | string | null;
  snapshots_per_cycle?: number | string | null;
  blocks_per_snapshot?: number | string | null;
  buffer_start_block?: number | string | null;
  buffer_blocks?: number | string | null;
  total_rewarded?: number | string | null;
}

export interface DefiPool {
  poolRewardsAddress: string;
  rewarded: number;
  snapshots: number[];
}

export interface DefiCycle {
  cycleId: number;
  rewardAddress: string | null;
  snapshotsPerCycle: number;
  blocksPerSnapshot: number;
  pools: DefiPool[];
}

export interface DualStackingData {
  cycle_id: number;
  current_cycle_bitcoin_height?: number | string | null;
  next_cycle_bitcoin_height: number | string | null;
  participants_count: number | string | null;
  snapshots_per_cycle: number | string | null;
  blocks_per_snapshot: number | string | null;
  buffer_blocks?: number | string | null;
  buffer_start_block?: number | string | null;
  reward_mechanism?: number;
  defi_multiplier?: number;
  start_time: number;
  end_time: number;
  total_rewarded?: number | string | null;
}

export type DualStackingDataResponse = DualStackingData[];

// Leaderboard
export interface LeaderboardEntry {
  enrolledAddress: string;
  rank: number;
  totalSbtcBalance: number;
  totalStxStacked: number;
  rewarded: number | null;
  weight: number | null;
  ratio: number | null;
  sbtcSnapshots: number[];
  stxSnapshots: number[];
}

export interface LeaderboardTotals {
  totalSbtcBalance: number;
  totalStxStacked: number;
  rewarded: number | null;
  weight: number | null;
  sbtcSnapshots: number[];
  stxSnapshots: number[];
}

export interface LeaderboardResponse {
  cycleId: string;
  leaderboard: LeaderboardEntry[];
  totals: LeaderboardTotals;
}

export interface IsEnrolledResponse {
  success: boolean;
  isEnrolledCurrentCycle: boolean;
  isEnrolledNextCycle: boolean;
}

// Coin Prices
export interface CoinPrice {
  yield_cycle_id: number;
  stx_price: string;
  btc_price: string;
}

export interface PoxApr {
  pox_cycle: number;
  stacking_apr: string;
}

export interface CoinPricesResponse {
  prices: CoinPrice[];
  aprs: PoxApr[];
  latest_prices?: {
    stx_price: string;
    btc_price: string;
  };
}
