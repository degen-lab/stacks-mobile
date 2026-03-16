// Terms
export type CheckTermsResponse = {
  exists: boolean;
};

// Enrolled Users
export interface EnrolledUserWithBalance {
  address: string;
  stx_stacked: string;
  sbtc_balance: string;
}

export type EnrolledUsersWithBalancesResponse = EnrolledUserWithBalance[];

// Total sBTC Enrolled
export interface TotalSbtcEnrolledResponse {
  wallet: number;
  defi: number;
  total: number;
}
