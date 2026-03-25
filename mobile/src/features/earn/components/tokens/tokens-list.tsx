import { View } from "@/components/ui";

import type { EarnAssetSnapshot } from "../../types";
import { TokensRow } from "./tokens-row";
import { TokensListSkeleton } from "./tokens-list.skeleton";

type TokensListProps = {
  assets: EarnAssetSnapshot[];
  isLoading: boolean;
  isBalanceVisible: boolean;
  onPressAsset?: (asset: EarnAssetSnapshot) => void;
};

export function TokensList({
  assets,
  isLoading,
  isBalanceVisible,
  onPressAsset,
}: TokensListProps) {
  if (isLoading) {
    return <TokensListSkeleton />;
  }

  if (assets.length === 0) {
    return null;
  }

  return (
    <View
      testID="earn-assets-list"
      className="overflow-hidden rounded-[20px] border border-surface-secondary bg-sand-50"
    >
      {assets.map((asset) => (
        <TokensRow
          key={asset.id}
          asset={asset}
          isBalanceVisible={isBalanceVisible}
          variant="list"
          onPress={onPressAsset ? () => onPressAsset(asset) : undefined}
        />
      ))}
    </View>
  );
}
