import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

export const CONTRACTS = {
  mainnet: {
    game: "",
    stackingFastPool: "SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3",
  },
  testnet: {
    game: "ST13XJ4G348VGDRT5Z791J8GBTB9Z0ESPNCRAPN4E.game-1_0_0",
    stackingFastPool: "",
  },
  devnet: {
    game: "",
    stackingFastPool: "",
  },
} as const;

export const SC_FUNCTIONS = {
  game: {
    readOnlyFunctions: {
      GET_CURRENT_TOURNAMENT: "get-current-tournament",
    },
    publicFunctions: {
      SUBMIT_SCORE: "submit-score",
    },
  },
  stackingFastPool: {
    readOnlyFunctions: {
      GET_DELEGATED_AMOUNT: "get-delegated-amount",
      CURRENT_POX_REWARD_CYCLE: "current-pox-reward-cycle",
      CAN_LOCK_NOW: "can-lock-now",
      GET_POOL_POX_ADDRESS: "get-pool-pox-address",
      CHECK_CALLER_ALLOWED: "check-caller-allowed",
      GET_ALLOWANCE_CONTRACT_CALLERS: "get-allowance-contract-callers",
    },
    publicFunctions: {
      DELEGATE_STX: "delegate-stx",

      ALLOW_CONTRACT_CALLER: "allow-contract-caller",
      DISALLOW_CONTRACT_CALLER: "disallow-contract-caller",
    },
  },
} as const;