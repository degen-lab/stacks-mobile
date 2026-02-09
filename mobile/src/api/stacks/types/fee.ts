export interface FeeEstimation {
  fee: number;
  fee_rate: number;
}

export interface FeeResponse {
  estimated_cost: {
    read_count: number;
    read_length: number;
    runtime: number;
    write_count: number;
    write_length: number;
  };
  estimated_len: number;
  estimations: FeeEstimation[];
}
