import type { AppToken } from "@/lib/assets/tokens";

const PORTFOLIO_LOCALE = "en-US";

export type PortfolioAssetKind = "btc" | "stx" | "sbtc" | "sip10";
export type PortfolioAssetLayer = "bitcoin" | "stacks";

export type PortfolioAssetDetail = {
  label: string;
  value: string;
};

export type PortfolioAssetSnapshot = {
  id: string;
  symbol: string;
  name: string;
  icon: string | null;
  kind?: PortfolioAssetKind;
  layer?: PortfolioAssetLayer;
  tokenContract?: string | null;
  assetIdentifier?: string | null;
  swapTokenId?: string | null;
  description?: string | null;
  amount: number;
  balanceBaseUnits: string;
  decimals: number;
  displayDecimals: number;
  unitPriceUsd: number | null;
  valueUsd: number | null;
  change24hPercent?: number | null;
  detail?: PortfolioAssetDetail;
};

export function getPortfolioTotalUsd(assets: PortfolioAssetSnapshot[]) {
  return assets.reduce((sum, asset) => sum + (asset.valueUsd ?? 0), 0);
}

export function getPortfolioDisplayDecimals(symbol: string, decimals: number) {
  if (symbol.trim().toUpperCase() === "STX") {
    return Math.min(decimals, 2);
  }

  return Math.min(decimals, 8);
}

export function formatPortfolioTokenAmount(
  amount: number,
  maximumFractionDigits: number,
) {
  return amount.toLocaleString(PORTFOLIO_LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

export function getPortfolioAssetDisplayName(asset: PortfolioAssetSnapshot) {
  if (asset.name === asset.symbol) return asset.name;
  return `${asset.name} (${asset.symbol})`;
}

export function getPortfolioAssetDescription(asset: PortfolioAssetSnapshot) {
  if (asset.description?.trim()) return asset.description;

  const normalizedSymbol = asset.symbol.trim().toUpperCase();
  if (normalizedSymbol === "BTC") {
    return "Bitcoin is the native asset of the Bitcoin network.";
  }

  if (normalizedSymbol === "STX") {
    return "STX is the native asset of the Stacks network and powers apps, fees, and stacking on Stacks.";
  }

  if (normalizedSymbol === "SBTC") {
    return "sBTC is a Bitcoin-backed asset on Stacks designed for fast, programmable Bitcoin use on Stacks.";
  }

  return `${asset.name} is a SIP-10 token on the Stacks network.`;
}

export function getPortfolioAssetLayerLabel(asset: PortfolioAssetSnapshot) {
  const layer =
    asset.layer ??
    (asset.symbol.trim().toUpperCase() === "BTC" ? "bitcoin" : "stacks");

  return layer === "bitcoin" ? "Layer 1 (Bitcoin)" : "Layer 2 (Stacks)";
}

export function getPortfolioAssetPriceChangeUsd(asset: PortfolioAssetSnapshot) {
  if (
    asset.unitPriceUsd == null ||
    asset.change24hPercent == null ||
    !Number.isFinite(asset.unitPriceUsd) ||
    !Number.isFinite(asset.change24hPercent)
  ) {
    return null;
  }

  const ratio = asset.change24hPercent / 100;
  if (ratio <= -1) return asset.unitPriceUsd;

  const previousPrice = asset.unitPriceUsd / (1 + ratio);
  return asset.unitPriceUsd - previousPrice;
}

export function getPortfolioAssetTransferAsset(
  asset: PortfolioAssetSnapshot,
): AppToken | null {
  const normalizedSymbol = asset.symbol.trim().toUpperCase();

  if (normalizedSymbol === "BTC") return "BTC" as const;
  if (normalizedSymbol === "STX") return "STX" as const;
  if (normalizedSymbol === "SBTC") return "sBTC" as const;

  return null;
}

export function getPortfolioAssetBuyAsset(asset: PortfolioAssetSnapshot) {
  const normalizedSymbol = asset.symbol.trim().toUpperCase();

  if (normalizedSymbol === "BTC") return "BTC" as const;
  if (normalizedSymbol === "STX") return "STX" as const;
  if (normalizedSymbol === "USDC") return "USDC" as const;

  return null;
}

export function getPortfolioAssetActionAvailability(
  asset: PortfolioAssetSnapshot,
) {
  return {
    send: getPortfolioAssetTransferAsset(asset) != null,
    receive: getPortfolioAssetTransferAsset(asset) != null,
    buy: getPortfolioAssetBuyAsset(asset) != null,
    swap: !!asset.swapTokenId,
  };
}
