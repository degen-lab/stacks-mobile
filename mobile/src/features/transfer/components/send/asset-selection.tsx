import { View } from "@/components/ui";
import { SharedAssetSelection } from "../shared-asset-selection";
import type { TransferAsset } from "../../types";

type AssetSelectionProps = {
  onSelectAsset: (asset: TransferAsset) => void;
  onNext: () => void;
};

export function AssetSelection({ onSelectAsset, onNext }: AssetSelectionProps) {
  const handleSelectAsset = (asset: TransferAsset) => {
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
