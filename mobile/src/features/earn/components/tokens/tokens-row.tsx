import { Pressable, Text, TokenAvatar, View } from "@/components/ui";

import { maskValue } from "@/lib/format/mask-display-value";
import { formatUsd } from "@/lib/format/currency";
import { formatPortfolioTokenAmount } from "@/lib/assets/portfolio";
import type { EarnAssetSnapshot } from "../../types";

type EarnAssetRowProps = {
  asset: EarnAssetSnapshot;
  isBalanceVisible: boolean;
  variant: "list" | "popover";
  onPress?: () => void;
};

function stripTrailingSymbol(value: string, symbol: string) {
  const suffix = ` ${symbol}`;
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

export function TokensRow({
  asset,
  isBalanceVisible,
  variant,
  onPress,
}: EarnAssetRowProps) {
  const isListVariant = variant === "list";
  const amountDisplay = maskValue(
    formatPortfolioTokenAmount(asset.amount, asset.displayDecimals),
    isBalanceVisible,
  );
  const balanceDisplay = `${amountDisplay} ${asset.symbol}`;
  const formattedValue = isListVariant
    ? formatUsd(asset.valueUsd, { maximumFractionDigits: 2 })
    : formatUsd(asset.valueUsd);
  const valueDisplay = maskValue(formattedValue, isBalanceVisible);
  const detailDisplay = asset.detail
    ? isListVariant
      ? asset.detail.value
      : stripTrailingSymbol(asset.detail.value, asset.symbol)
    : null;
  const containerClassName =
    "flex-row items-center justify-between gap-3 px-3 py-3.5";
  const rowContent = (
    <>
      <View className="min-w-0 flex-1 flex-row items-center gap-3.5">
        <View className="w-10 items-center justify-center">
          <TokenAvatar symbol={asset.symbol} icon={asset.icon} size={32} />
        </View>

        <View className="min-w-0 flex-1">
          <Text
            className="font-matter text-base leading-5 text-primary"
            numberOfLines={1}
          >
            {isListVariant ? asset.name : `${asset.name} (${asset.symbol})`}
          </Text>

          {detailDisplay ? (
            <Text
              className={`mt-0.5 leading-4 text-secondary ${
                isListVariant
                  ? "font-instrument-sans text-[11px]"
                  : "font-instrument-sans text-xs"
              }`}
              numberOfLines={1}
            >
              {`${asset.detail!.label} ${detailDisplay}`}
            </Text>
          ) : null}

          {!isListVariant ? (
            <Text
              className="mt-0.5 font-instrument-sans text-xs leading-4 text-secondary"
              numberOfLines={1}
            >
              {`Current price ${
                asset.unitPriceUsd == null
                  ? "Unavailable"
                  : formatUsd(asset.unitPriceUsd)
              }`}
            </Text>
          ) : null}
        </View>
      </View>

      <View className={isListVariant ? "items-end gap-0.5" : "items-end gap-1"}>
        <Text
          testID={isListVariant ? `earn-asset-value-${asset.id}` : undefined}
          className="font-instrument-sans-medium text-base leading-5 text-primary"
          numberOfLines={1}
        >
          {valueDisplay}
        </Text>

        <Text
          testID={isListVariant ? `earn-asset-owned-${asset.id}` : undefined}
          className="font-instrument-sans text-xs leading-4 text-secondary"
          numberOfLines={1}
        >
          {balanceDisplay}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        testID={isListVariant ? `earn-asset-card-${asset.id}` : undefined}
        className={containerClassName}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${asset.name} details`}
      >
        {rowContent}
      </Pressable>
    );
  }

  return (
    <View
      testID={isListVariant ? `earn-asset-card-${asset.id}` : undefined}
      className={containerClassName}
    >
      {rowContent}
    </View>
  );
}
