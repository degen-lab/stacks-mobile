import { View, Text, SelectionCard } from "@/components/ui";
import { StxCoin, BtcLogo } from "@/components/ui/icons";
import type { TransferAsset } from "../types";

const ASSETS = [
  {
    id: "STX" as const,
    name: "Stacks",
    symbol: "STX",
    logo: <StxCoin size={32} />,
    disabled: false,
  },
  {
    id: "BTC" as const,
    name: "Bitcoin",
    symbol: "BTC",
    logo: <BtcLogo size={32} />,
    disabled: true,
  },
  {
    id: "sBTC" as const,
    name: "sBTC",
    symbol: "sBTC",
    logo: <BtcLogo size={32} />,
    disabled: true,
  },
];

type SharedAssetSelectionProps = {
  // selectedAsset?: TransferAsset | null;
  onSelectAsset: (asset: TransferAsset) => void;
};

export function SharedAssetSelection({
  // selectedAsset?: TransferAsset | null;
  onSelectAsset,
}: SharedAssetSelectionProps) {
  return (
    <View className="gap-3">
      {ASSETS.map((asset) => (
        <SelectionCard
          key={asset.id}
          icon={asset.logo}
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
