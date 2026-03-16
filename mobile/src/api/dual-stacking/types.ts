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
  current_cycle_bitcoin_height?: number;
  next_cycle_bitcoin_height: number;
  participants_count: number;
  snapshots_per_cycle: number;
  blocks_per_snapshot: number;
  buffer_blocks?: number;
  buffer_start_block?: number;
  reward_mechanism?: number;
  defi_multiplier?: number;
  cycle_total_sbtc_in_wallet?: number;
  cycle_total_sbtc_in_defis?: number;
  cycle_total_stx: number;
  start_time: number;
  end_time: number;
  total_rewarded: number;
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
