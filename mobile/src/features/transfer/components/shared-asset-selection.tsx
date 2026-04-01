import { SelectionCard, Text, TokenAvatar, View } from "@/components/ui";
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

type SharedAssetSelectionProps = {
  onSelectAsset: (asset: AppToken) => void;
  assetAvailability?: AssetAvailabilityMap;
  balances?: AssetBalanceMap;
  balanceLoading?: AssetBalanceLoadingMap;
};

function formatAssetBalance(asset: AppToken, balance: number) {
  const maximumFractionDigits = asset === "STX" ? 6 : 8;

  return balance.toLocaleString("en-US", {
    maximumFractionDigits,
  });
}

export function SharedAssetSelection({
  onSelectAsset,
  assetAvailability,
  balances,
  balanceLoading,
}: SharedAssetSelectionProps) {
  return (
    <View className="gap-3">
      {ASSETS.map((asset) => {
        const availability =
          assetAvailability?.[asset.id] ?? DEFAULT_ASSET_AVAILABILITY[asset.id];
        const disabledLabel = availability.disabledLabel;
        const disabled = availability.enabled === false;
        const isBalanceLoading = balanceLoading?.[asset.id] ?? false;
        const balance = balances?.[asset.id] ?? 0;
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
            rightContentAlign="top"
            rightContent={
              <Text
                className="max-w-[132px] font-instrument-sans-medium text-right text-xs text-sand-500"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {isBalanceLoading
                  ? "Available: Loading..."
                  : `Available: ${formatAssetBalance(asset.id, balance)}`}
              </Text>
            }
          />
        );
      })}
    </View>
  );
}
