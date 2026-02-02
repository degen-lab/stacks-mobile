export const CONTRACTS = {
  mainnet: {
    game: "",
    pox: "SP000000000000000000002Q6VF78.pox-4",
    stackingFastPool:
      "SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3",
  },
  testnet: {
    game: "ST13XJ4G348VGDRT5Z791J8GBTB9Z0ESPNCRAPN4E.game-1_0_0",
    pox: "",
    stackingFastPool: "",
  },
  devnet: {
    game: "",
    pox: "",
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
      // TODO: used to check if user allowed the fast pool to delegate for him
      GET_ALLOWANCE_CONTRACT_CALLERS: "get-allowance-contract-callers",
    },
    publicFunctions: {
      DELEGATE_STX: "delegate-stx",

      // TODO: used for automation
      ALLOW_CONTRACT_CALLER: "allow-contract-caller",
      DISALLOW_CONTRACT_CALLER: "disallow-contract-caller",
    },
  },
  pox: {
    readOnlyFunctions: {
      GET_ALLOWANCE_CONTRACT_CALLERS: "get-allowance-contract-callers",
    },
    publicFunctions: {
      REVOKE_DELEGATE_STX: "revoke-delegate-stx",
      ALLOW_CONTRACT_CALLER: "allow-contract-caller",
      DISALLOW_CONTRACT_CALLER: "disallow-contract-caller",
    },
  },
} as const;
