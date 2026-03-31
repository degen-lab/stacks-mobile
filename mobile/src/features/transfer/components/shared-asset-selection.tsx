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

const DEFAULT_ASSET_AVAILABILITY: Record<AppToken, AssetAvailability> = {
  STX: { enabled: true },
  BTC: { enabled: true },
  sBTC: { enabled: false, disabledLabel: "Coming soon" },
};

type SharedAssetSelectionProps = {
  onSelectAsset: (asset: AppToken) => void;
  assetAvailability?: AssetAvailabilityMap;
};

export function SharedAssetSelection({
  onSelectAsset,
  assetAvailability,
}: SharedAssetSelectionProps) {
  return (
    <View className="gap-3">
      {ASSETS.map((asset) => {
        const availability =
          assetAvailability?.[asset.id] ?? DEFAULT_ASSET_AVAILABILITY[asset.id];
        const disabledLabel = availability.disabledLabel;
        const disabled = availability.enabled === false;
        return (
          <SelectionCard
            key={asset.id}
            icon={<TokenAvatar symbol={asset.symbol} size={32} />}
            title={asset.name}
            subtitle={asset.symbol}
            disabled={disabled}
            onPress={() => onSelectAsset(asset.id)}
            rightContent={
              disabled && disabledLabel ? (
                <Text className="text-xs font-instrument-sans text-secondary">
                  {disabledLabel}
                </Text>
              ) : undefined
            }
          />
        );
      })}
    </View>
  );
}
