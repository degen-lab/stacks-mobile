import { SelectionCard, Text, TokenAvatar, View } from "@/components/ui";
import { useBtcPrice } from "@/api/market/use-btc-price";
import { useStacksPrice } from "@/api/market/use-stacks-price";
import { formatUsd } from "@/lib/format/currency";
import type { AppToken } from "@/lib/assets/tokens";

const ASSETS = [
  {
    id: "STX" as const,
    name: "Stacks",
    symbol: "STX",
  },
  {
    id: "BTC" as const,
    name: "Bitcoin",
    symbol: "BTC",
  },
  {
    id: "sBTC" as const,
    name: "sBTC",
    symbol: "sBTC",
  },
];

export type AssetAvailability = {
  enabled?: boolean;
  disabledLabel?: string;
};

export type AssetAvailabilityMap = Partial<Record<AppToken, AssetAvailability>>;
export type AssetBalanceMap = Partial<Record<AppToken, number>>;
export type AssetBalanceLoadingMap = Partial<Record<AppToken, boolean>>;

const DEFAULT_ASSET_AVAILABILITY: Record<AppToken, AssetAvailability> = {
  STX: { enabled: true },
  BTC: { enabled: true },
  sBTC: { enabled: false, disabledLabel: "Coming soon" },
};

function formatAssetBalance(asset: AppToken, balance: number) {
  const maximumFractionDigits = asset === "STX" ? 6 : 8;
  return balance.toLocaleString("en-US", { maximumFractionDigits });
}

function getUsdPrice(
  assetId: AppToken,
  stxPriceUsd: number | null,
  btcPriceUsd: number | null,
): number | null {
  if (assetId === "STX") return stxPriceUsd;
  if (assetId === "BTC" || assetId === "sBTC") return btcPriceUsd;
  return null;
}

export function SharedAssetSelection({
  onSelectAsset,
  assetAvailability,
  balances,
  balanceLoading,
}: {
  onSelectAsset: (asset: AppToken) => void;
  assetAvailability?: AssetAvailabilityMap;
  balances?: AssetBalanceMap;
  balanceLoading?: AssetBalanceLoadingMap;
}) {
  const { data: stxMarketData } = useStacksPrice();
  const { data: btcMarketData } = useBtcPrice();
  const stxPriceUsd = stxMarketData?.usd ?? null;
  const btcPriceUsd = btcMarketData?.usd ?? null;

  return (
    <View className="gap-3">
      {ASSETS.map((asset) => {
        const availability =
          assetAvailability?.[asset.id] ?? DEFAULT_ASSET_AVAILABILITY[asset.id];
        const disabledLabel = availability.disabledLabel;
        const disabled = availability.enabled === false;
        const isBalanceLoading = balanceLoading?.[asset.id] ?? false;
        const balance = balances?.[asset.id] ?? 0;
        const unitPrice = getUsdPrice(asset.id, stxPriceUsd, btcPriceUsd);
        const usdValue = unitPrice !== null ? balance * unitPrice : null;

        return (
          <SelectionCard
            key={asset.id}
            icon={<TokenAvatar symbol={asset.symbol} size={32} />}
            title={asset.name}
            subtitle={asset.symbol}
            bottomContent={
              disabled && disabledLabel ? (
                <Text className="text-xs font-instrument-sans text-secondary">
                  {disabledLabel}
                </Text>
              ) : undefined
            }
            disabled={disabled}
            onPress={() => onSelectAsset(asset.id)}
            rightContent={
              isBalanceLoading ? (
                <Text className="font-instrument-sans text-xs text-secondary">
                  Loading...
                </Text>
              ) : (
                <View className="items-end gap-0.5">
                  {usdValue !== null && (
                    <Text className="font-instrument-sans-medium text-sm text-primary">
                      {formatUsd(usdValue)}
                    </Text>
                  )}
                  <Text className="font-instrument-sans text-xs text-secondary">
                    {formatAssetBalance(asset.id, balance)} {asset.symbol}
                  </Text>
                </View>
              )
            }
          />
        );
      })}
    </View>
  );
}
