import { View } from "@/components/ui";
import {
  SharedAssetSelection,
  type AssetBalanceLoadingMap,
  type AssetBalanceMap,
  type AssetAvailabilityMap,
} from "../shared-asset-selection";
import type { AppToken } from "@/lib/assets/tokens";

type AssetSelectionProps = {
  onSelectAsset: (asset: AppToken) => void;
  onNext: () => void;
  assetAvailability?: AssetAvailabilityMap;
  balances?: AssetBalanceMap;
  balanceLoading?: AssetBalanceLoadingMap;
};

export function AssetSelection({
  onSelectAsset,
  onNext,
  assetAvailability,
  balances,
  balanceLoading,
}: AssetSelectionProps) {
  const handleSelectAsset = (asset: AppToken) => {
    onSelectAsset(asset);
    setTimeout(() => {
      onNext();
    }, 200);
  };

  return (
    <View className="px-5 pb-6">
      <SharedAssetSelection
        onSelectAsset={handleSelectAsset}
        assetAvailability={assetAvailability}
        balances={balances}
        balanceLoading={balanceLoading}
      />
    </View>
  );
}
