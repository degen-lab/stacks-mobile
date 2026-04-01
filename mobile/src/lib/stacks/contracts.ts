export const CONTRACTS = {
  mainnet: {
    game: "",
    stackingFastPool:
      "SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP.pox4-fast-pool-v3",
    yield: "SP1HFCRKEJ8BYW4D0E3FAWHFDX8A25PPAA83HWWZ9.dual-stacking-v2_0_4",
    yieldV2: "SP1HFCRKEJ8BYW4D0E3FAWHFDX8A25PPAA83HWWZ9.dual-stacking-v2_0_5",
    sbtc: "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token",
    pox: "SP000000000000000000002Q6VF78.pox-4",
  },
  testnet: {
    game: "ST13XJ4G348VGDRT5Z791J8GBTB9Z0ESPNCRAPN4E.game-1_0_0",
    pox: "",
    stackingFastPool: "",
    yield: "",
    yieldV2: "",
    sbtc: "",
  },
  devnet: {
    game: "",
    pox: "",
    stackingFastPool: "",
    yield: "",
    yieldV2: "",
    sbtc: "",
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
  yield: {
    readOnlyFunctions: {
      IS_ENROLLED_NEXT_CYCLE: "is-enrolled-in-next-cycle",
      IS_ENROLLED_THIS_CYCLE: "is-enrolled-this-cycle",
      GET_CURRENT_BITCOIN_HEIGHT: "get-current-bitcoin-block-height",
      GET_LATEST_REWARD_ADDRESS: "get-latest-reward-address",
      GET_CYCLE_DATA: "cycle-data",
      GET_IS_CONTRACT_ACTIVE: "get-is-contract-active",
      GET_MIN_HOLD_FOR_ENROLLMENT: "get-minimum-enrollment-amount",
      GET_AMOUNT_STACKED_NOW: "get-amount-stacked-now",
      IS_DISTRIBUTION_FINALIZED_FOR_CURRENT_CYCLE:
        "is-distribution-finalized-for-current-cycle",
      GET_NR_CYCLES_YEAR: "nr-cycles-year",
    },
    publicFunctions: {
      ENROLL: "enroll",
      OPT_OUT: "opt-out",
      CHANGE_REWARDS_ADDRESS: "change-reward-address",
    },
  },
  yieldV2: {
    readOnlyFunctions: {
      IS_ENROLLED_NEXT_CYCLE: "is-enrolled-in-next-cycle",
      IS_ENROLLED_THIS_CYCLE: "is-enrolled-this-cycle",
      GET_CURRENT_BITCOIN_HEIGHT: "get-current-bitcoin-block-height",
      GET_LATEST_REWARD_ADDRESS: "get-latest-reward-address",
      GET_CYCLE_DATA: "cycle-data",
      GET_IS_CONTRACT_ACTIVE: "get-is-contract-active",
      GET_MIN_HOLD_FOR_ENROLLMENT: "get-minimum-enrollment-amount",
      GET_AMOUNT_STACKED_NOW: "get-amount-stacked-now",
      IS_DISTRIBUTION_FINALIZED_FOR_CURRENT_CYCLE:
        "is-distribution-finalized-for-current-cycle",
      GET_NR_CYCLES_YEAR: "nr-cycles-year",
      GET_DEFI_SBTC_BALANCE: "get-defi-sbtc-balance-now",
    },
    publicFunctions: {
      ENROLL: "enroll",
      OPT_OUT: "opt-out",
      CHANGE_REWARDS_ADDRESS: "change-reward-address",
    },
  },
  sbtc: {
    readOnlyFunctions: {
      GET_SBTC_BALANCE: "get-balance-available",
    },
    publicFunctions: {},
  },
} as const;
