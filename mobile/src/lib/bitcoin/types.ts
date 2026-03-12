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

export interface BitcoinFeeRecommendation {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

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
