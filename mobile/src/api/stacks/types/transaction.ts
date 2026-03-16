export type TransactionStatus =
  | "success"
  | "pending"
  | "failed"
  | "abort_by_response"
  | "abort_by_post_condition"
  | "rejected";

export type Transaction = {
  tx_id: string;
  nonce: number;
  fee_rate: string;
  sender_address: string;
  sponsor_nonce?: number;
  sponsored: boolean;
  sponsor_address?: string;
  post_condition_mode: string;
  post_conditions: unknown[];
  anchor_mode: string;
  block_hash?: string;
  block_height?: number;
  block_time?: number;
  block_time_iso?: string;
  burn_block_time?: number;
  burn_block_height?: number;
  burn_block_time_iso?: string;
  parent_burn_block_time?: number;
  parent_burn_block_time_iso?: string;
  canonical: boolean;
  tx_index?: number;
  tx_status: TransactionStatus;
  tx_result?: {
    hex: string;
    repr: string;
  };
  event_count?: number;
  parent_block_hash?: string;
  is_unanchored: boolean;
  microblock_hash?: string;
  microblock_sequence?: number;
  microblock_canonical?: boolean;
  execution_cost_read_count?: number;
  execution_cost_read_length?: number;
  execution_cost_runtime?: number;
  execution_cost_write_count?: number;
  execution_cost_write_length?: number;
  vm_error?: string;
  events?: unknown[];
  tx_type: string;
  [key: string]: unknown; // Allow for transaction type-specific fields
};
