import { Text, View, colors } from "@/components/ui";
import { Popover } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { TokensRow } from "@/features/earn/components/tokens/tokens-row";
import { maskValue } from "@/lib/format/mask-display-value";
import { formatUsd } from "@/lib/format/currency";
import type { EarnAssetSnapshot } from "@/features/earn/types";

type EarnBalancePopoverProps = {
  visible: boolean;
  onClose: () => void;
  totalBalanceUsd: number | null;
  assets: EarnAssetSnapshot[];
  loading?: boolean;
  isBalanceVisible: boolean;
  onPressAsset?: (asset: EarnAssetSnapshot) => void;
};

export function EarnBalancePopover({
  visible,
  onClose,
  totalBalanceUsd,
  assets,
  loading = false,
  isBalanceVisible,
  onPressAsset,
}: EarnBalancePopoverProps) {
  const formattedTotalBalance = maskValue(
    formatUsd(totalBalanceUsd),
    isBalanceVisible,
  );

  return (
    <Popover
      visible={visible}
      onClose={onClose}
      contentClassName="px-4 pb-5 pt-5"
    >
      <View className="gap-4">
        {loading ? (
          <>
            <View
              className="items-center gap-1.5 rounded-2xl px-4 py-4"
              style={{
                borderWidth: 1,
                borderColor: colors.success[200],
                backgroundColor: colors.success[50],
              }}
            >
              <Skeleton className="h-10 w-36 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </View>
            <View className="overflow-hidden rounded-[20px] border border-surface-secondary bg-sand-50">
              {[0, 1, 2].map((index) => (
                <View key={index}>
                  {index > 0 ? (
                    <View className="mx-3 h-px bg-border-secondary" />
                  ) : null}
                  <View className="flex-row items-center justify-between gap-3 px-3 py-3.5">
                    <View className="flex-1 flex-row items-center gap-3.5">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <View className="flex-1 gap-1.5">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                        <Skeleton className="h-3 w-28 rounded" />
                      </View>
                    </View>
                    <Skeleton className="h-4 w-14 rounded" />
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View
              className="items-center gap-1 rounded-2xl px-4 py-4"
              style={{
                borderWidth: 1,
                borderColor: colors.success[200],
                backgroundColor: colors.success[50],
              }}
            >
              <Text
                className="font-matter text-4xl leading-tight"
                style={{ color: colors.success[700] }}
              >
                {formattedTotalBalance}
              </Text>
              <Text className="font-instrument-sans text-xs uppercase tracking-[1.5px] text-secondary">
                Account balance
              </Text>
            </View>

            <View className="overflow-hidden rounded-[20px] border border-surface-secondary bg-sand-50">
              {assets.map((asset, index) => (
                <View key={asset.id}>
                  {index > 0 ? (
                    <View className="mx-3 h-px bg-border-secondary" />
                  ) : null}
                  <TokensRow
                    asset={asset}
                    isBalanceVisible={isBalanceVisible}
                    variant="popover"
                    onPress={
                      onPressAsset ? () => onPressAsset(asset) : undefined
                    }
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </Popover>
  );
}
