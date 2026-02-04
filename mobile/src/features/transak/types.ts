export type AssetOption = "STX" | "BTC" | "USDC";

export type TransakDrawerRef = {
  present: (defaultAsset?: AssetOption, action?: "buy" | "sell") => void;
  dismiss: () => void;
};
