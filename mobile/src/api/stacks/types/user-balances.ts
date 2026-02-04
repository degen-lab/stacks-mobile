export interface UserBalances {
  stx: StxBalance;
  fungible_tokens: Record<string, FungibleTokenBalance>;
  non_fungible_tokens: Record<string, NonFungibleTokenBalance>;
}

export interface StxBalance {
  balance: string;
  total_miner_rewards_received: string;
  lock_tx_id: string;
  locked: string;
  lock_height: number;
  burnchain_lock_height: number;
  burnchain_unlock_height: number;
  estimated_balance: string;
  pending_balance_inbound: string;
  pending_balance_outbound: string;
  total_sent: string;
  total_received: string;
  total_fees_sent: string;
}

export interface FungibleTokenBalance {
  balance: string;
  total_sent: string;
  total_received: string;
}

export interface NonFungibleTokenBalance {
  count: string;
  total_sent: string;
  total_received: string;
}
