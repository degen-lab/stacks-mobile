import { View } from "@/components/ui";
import { SharedAssetSelection } from "../shared-asset-selection";
import type { AppToken } from "@/lib/assets/tokens";

type AssetSelectionProps = {
  onSelectAsset: (asset: AppToken) => void;
  onNext: () => void;
};

export function AssetSelection({ onSelectAsset, onNext }: AssetSelectionProps) {
  const handleSelectAsset = (asset: AppToken) => {
    onSelectAsset(asset);
    setTimeout(() => {
      onNext();
    }, 200);
  };

  return (
    <View className="px-5 pb-6">
      <SharedAssetSelection onSelectAsset={handleSelectAsset} />
    </View>
  );
}
