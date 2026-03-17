export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type SwapTokenPriceData = {
  "1h_change": number | null;
  "1yr_change": number | null;
  "24h_change": number | null;
  "30d_change": number | null;
  "7d_change": number | null;
  last_price: number | null;
  last_updated: string | null;
};

export type SwapTokenWrap = {
  tokenContract: string;
  tokenDecimals: number;
  tokenName: string | null;
};

export type SwapToken = {
  base: string;
  type: string;
  icon: string;
  name: string;
  status: string;
  symbol: string;
  tokenId: string;
  "token-id": string;
  tokenContract: string | null;
  tokenDecimals: number;
  tokenName: string | null;
  wrapTokens: Record<string, SwapTokenWrap> | null;
  isKeeperToken: boolean;
  bridge: "TRUE" | "FALSE";
  layerOneAsset: {
    address: string;
    divisibility: number;
    icon: string;
    isBitcoin: boolean;
    runeid: string;
    spacedRune: string;
    symbol: string | null;
  } | null;
  priceData: SwapTokenPriceData;
};

export type SwapRoutePostConditionTemplate = {
  dikoStx: string | null;
  ignoreMinReceived: string | null;
  senderAddress: string;
  shareFeeContract: string | null;
  tokenContract: string;
  tokenDecimals: number | string;
  tokenName: string;
};

export type SwapRouteCallTemplate = {
  contract: string;
  function: string;
  isKeeperRoute?: boolean;
  parameters: Record<string, unknown>;
};

export type SwapRouteTemplate = {
  dex_path: string[];
  postConditions: Record<string, SwapRoutePostConditionTemplate>;
  quoteData: SwapRouteCallTemplate;
  swapData: SwapRouteCallTemplate;
  token_path: string[];
};

export type SwapPossiblePairs = Record<string, SwapRouteTemplate[]>;

export type SerializedClarityValue =
  | { type: "int"; value: string }
  | { type: "uint"; value: string }
  | { type: "none" }
  | { type: "some"; value: SerializedClarityValue }
  | { type: "true" }
  | { type: "false" }
  | { type: "address"; value: string }
  | { type: "principal"; value: string }
  | { type: "contract"; value: string }
  | { type: "ok"; value: SerializedClarityValue }
  | { type: "err"; value: SerializedClarityValue }
  | { type: "tuple"; value: Record<string, SerializedClarityValue> }
  | { type: "list"; value: SerializedClarityValue[] }
  | { type: "ascii"; value: string }
  | { type: "utf8"; value: string }
  | { type: "buffer"; value: string };

export type SerializedPostCondition =
  | {
      type: "stx-postcondition";
      address: string;
      condition: "eq" | "gt" | "gte" | "lt" | "lte";
      amount: string;
    }
  | {
      type: "ft-postcondition";
      address: string;
      condition: "eq" | "gt" | "gte" | "lt" | "lte";
      amount: string;
      asset: string;
    }
  | {
      type: "nft-postcondition";
      address: string;
      condition: "sent" | "not-sent";
      asset: string;
      assetId: SerializedClarityValue;
    };

export type SwapContractCallParams = {
  functionArgs: SerializedClarityValue[];
  postConditions: SerializedPostCondition[];
  contractAddress: string;
  contractName: string;
  functionName: string;
};

export type DefiOperation = {
  id: number;
  senderAddress: string;
  txId: string | null;
  status: number;
  operationType: "Swap" | "Lending";
  metadata: {
    tokenIn: string;
    tokenOut: string;
    amount: number;
  };
  createdAt: string;
};

// GET /defi/swap-params
export type SwapQuoteData = {
  contractCallParams: SwapContractCallParams;
};

// POST /defi/swap-params
export type SwapParamsResponse = {
  defiOperation: DefiOperation;
  contractCallParams: SwapContractCallParams;
};

export type SwapParamsData = {
  operation: DefiOperation;
  contractCallParams: SwapContractCallParams;
};

export type UpdateDefiOperationRequest = {
  id: number;
  txId: string;
};

export type UpdateDefiOperationResponse = {
  success: boolean;
  message: string;
};
