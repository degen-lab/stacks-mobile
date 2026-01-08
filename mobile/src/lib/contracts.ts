import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

export const CONTRACTS = {
  mainnet: {
    game: {
      CONTRACT: "",
    },
  },
  testnet: {
    game: {
      CONTRACT: "ST13XJ4G348VGDRT5Z791J8GBTB9Z0ESPNCRAPN4E.game-1_0_0",
    },
  },
  devnet: {
    game: {
      CONTRACT: "",
    },
  },
} satisfies Record<NetworkType, Record<string, { CONTRACT: string }>>;

export const SC_FUNCTIONS = {
  game: {
    readOnlyFunctions: {
      GET_CURRENT_TOURNAMENT: "get-current-tournament",
    },
    publicFunctions: {
      SUBMIT_SCORE: "submit-score",
    },
  },
} as const;
