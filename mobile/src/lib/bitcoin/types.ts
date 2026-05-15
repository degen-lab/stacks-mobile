import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

export type BitcoinAppNetwork = NetworkType;

export interface BitcoinAddressUtxo {
  txid: string;
  vout: number;
  value: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
  };
}

export interface BitcoinAddressStats {
  funded_txo_sum: number;
  spent_txo_sum: number;
}

export interface BitcoinAddressInfo {
  address: string;
  chain_stats: BitcoinAddressStats;
  mempool_stats: BitcoinAddressStats;
}

export interface BitcoinFeeRecommendation {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export type MempoolFeeRecommendation = BitcoinFeeRecommendation;

export interface PreparedBitcoinSend {
  txId: string;
  rawTxHex: string;
  feeSats: number;
  feeRate: number;
  inputSats: number;
  amountSats: number;
  changeSats: number;
  recipient: string;
  senderAddress: string;
}

export type MempoolTransaction = {
  txid: string;
  fee?: number;
  weight?: number;
  vsize?: number;
  adjusted_vsize?: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  vin: {
    prevout: {
      scriptpubkey_address?: string;
    };
  }[];
  vout: {
    value: number;
    scriptpubkey: string;
    scriptpubkey_address?: string;
  }[];
};

export type MempoolProjectedBlock = {
  blockSize: number;
  blockVSize: number;
  nTx: number;
  totalFees: number;
  medianFee: number;
  feeRange: number[];
};

export type MempoolRbfResponse = {
  replacements?: {
    tx?: {
      txid: string;
    };
  };
};
