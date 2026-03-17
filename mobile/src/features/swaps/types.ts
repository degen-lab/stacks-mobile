import type { SwapToken } from "@/api/defi";

export type SwapAsset = {
  tokenId: string;
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  tokenContract: string | null;
  balanceBaseUnits: string;
  balanceDisplay: string;
  hasBalance: boolean;
  usdPrice: number | null;
  token: SwapToken;
};

export type SwapSheetStep =
  | "form"
  | "review"
  | "picker-source"
  | "picker-destination";

export type SwapSheetRequest = {
  sourceTokenId?: string;
  destinationTokenId?: string;
  amount?: string;
};
