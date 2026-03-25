import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

export type SbtcBridgeConfig = {
  network: NetworkType;
  isEnabled: boolean;
  emilyUrl: string;
  contractDeployer: string;
  sbtcTokenContractId: string;
  sbtcWithdrawalContractId: string;
  sbtcRegistryContractId: string;
  mempoolApiUrl: string;
  publicMempoolUrl: string;
  hiroApiUrl: string;
  reclaimLockTime: number;
  pollingInterval: number;
  withdrawalFeeMultiplier: number;
  withdrawMinAmountSats: number;
  maxWithdrawalTxSize: number;
};

export type EmilyLimits = {
  pegCap: number;
  perDepositCap: number;
  perWithdrawalCap: number;
  perDepositMinimum: number;
  availableToWithdraw: number;
};

export type EmilyDepositBase = {
  bitcoinTxid: string;
  bitcoinTxOutputIndex: number;
  recipient: string;
  amount: number;
  lastUpdateHeight: number;
  lastUpdateBlockHash: string;
  statusMessage: string;
  parameters: {
    maxFee: number;
    lockTime: number;
  };
  reclaimScript: string;
  depositScript: string;
};

export type EmilyDeposit = EmilyDepositBase &
  (
    | {
        status: "pending";
      }
    | {
        status: "accepted";
      }
    | {
        status: "confirmed";
        fulfillment: {
          BitcoinTxid: string;
          BitcoinTxIndex: number;
          StacksTxid: string;
          BitcoinBlockHash: string;
          BitcoinBlockHeight: number;
          BtcFee: number;
        };
      }
  );

export type EmilyWithdrawal = {
  requestId: number;
  stacksBlockHash: string;
  stacksBlockHeight: number;
  recipient: string;
  sender: string;
  amount: number;
  lastUpdateHeight: number;
  lastUpdateBlockHash: string;
  status: string;
  statusMessage: string;
  parameters: {
    maxFee: number;
  };
  fulfillment?: {
    BitcoinTxid: string;
    BitcoinTxIndex: number;
    StacksTxid: string;
    BitcoinBlockHash: string;
    BitcoinBlockHeight: number;
    BtcFee: number;
  };
};

export type {
  MempoolTransaction,
  MempoolProjectedBlock,
  MempoolFeeRecommendation,
  MempoolRbfResponse,
} from "@/lib/bitcoin/types";

export type HiroTransaction = {
  tx_id: string;
  tx_status: string;
  burn_block_time?: number;
  contract_call?: {
    contract_id: string;
    function_name: string;
    function_args: {
      hex: string;
      repr: string;
      name: string;
      type: string;
    }[];
  };
  events?: {
    event_type: string;
    contract_log?: {
      value: {
        hex: string;
      };
    };
  }[];
};

export type BridgeHistoryItem =
  | {
      type: "deposit";
      data: EmilyDepositBase & { status: string };
    }
  | {
      type: "withdrawal";
      data: {
        requestId: number;
        stacksBlockHash: string;
        stacksBlockHeight: number;
        recipient: string;
        sender: string;
        amount: number;
        lastUpdateHeight: number;
        lastUpdateBlockHash: string;
        status: string;
        txid: string;
      };
    };
