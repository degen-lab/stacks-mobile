import { SelectionCard, Text, TokenAvatar, View } from "@/components/ui";
import type { TransferAsset } from "../types";

const ASSETS = [
  {
    id: "STX" as const,
    name: "Stacks",
    symbol: "STX",
    disabled: false,
  },
  {
    id: "BTC" as const,
    name: "Bitcoin",
    symbol: "BTC",
    disabled: false,
  },
  {
    id: "sBTC" as const,
    name: "sBTC",
    symbol: "sBTC",
    disabled: true,
  },
];

type SharedAssetSelectionProps = {
  onSelectAsset: (asset: TransferAsset) => void;
};

export function SharedAssetSelection({
  onSelectAsset,
}: SharedAssetSelectionProps) {
  return (
    <View className="gap-3">
      {ASSETS.map((asset) => (
        <SelectionCard
          key={asset.id}
          icon={<TokenAvatar symbol={asset.symbol} size={32} />}
          title={asset.name}
          subtitle={asset.symbol}
          disabled={asset.disabled}
          onPress={() => onSelectAsset(asset.id)}
          rightContent={
            asset.disabled ? (
              <Text className="text-xs font-instrument-sans text-secondary">
                Coming soon
              </Text>
            ) : undefined
          }
        />
      ))}
    </View>
  );
}
