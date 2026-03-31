import { useCallback, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  CreditCard,
} from "lucide-react-native";

import { useFtMetadataMap } from "@/api/stacks/use-ft-metadata";
import {
  Button,
  Pressable,
  SafeAreaView,
  ScrollView,
  Skeleton,
  Text,
  TokenAvatar,
  View,
} from "@/components/ui";
import { SwapActionIcon } from "@/components/ui/icons";
import { useSwapSheet } from "@/features/swaps";
import { useTransferSheet } from "@/features/transfer";
import { useTransak } from "@/features/transak/context/transak-context";
import { usePortfolioBalance } from "@/hooks/use-portfolio-balance";
import {
  formatPortfolioTokenAmount,
  getPortfolioAssetActionAvailability,
  getPortfolioAssetBuyAsset,
  getPortfolioAssetDescription,
  getPortfolioAssetDisplayName,
  getPortfolioAssetLayerLabel,
  getPortfolioAssetPriceChangeUsd,
  getPortfolioAssetTransferAsset,
  type PortfolioAssetSnapshot,
} from "@/lib/assets/portfolio";
import { copyToClipboard } from "@/lib/clipboard";
import { formatUsd } from "@/lib/format/currency";
import { maskValue } from "@/lib/format/mask-display-value";
import { formatContractIdentifier } from "@/lib/stacks/addresses";
import { useBalanceVisibility } from "@/lib/store/balance-visibility";

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatAssetUnitPrice(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "Unavailable";

  const maximumFractionDigits = value >= 1 ? 2 : value >= 0.01 ? 4 : 6;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  });
}

function getAssetPriceChangeDisplay(asset: PortfolioAssetSnapshot) {
  if (
    asset.change24hPercent == null ||
    !Number.isFinite(asset.change24hPercent)
  ) {
    return null;
  }

  const priceChangeUsd = getPortfolioAssetPriceChangeUsd(asset);
  if (priceChangeUsd == null) return null;

  const percentSign =
    asset.change24hPercent > 0 ? "+" : asset.change24hPercent < 0 ? "-" : "";
  const percentValue = Math.abs(asset.change24hPercent).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );
  const absoluteChangeUsd = Math.abs(priceChangeUsd);
  const absoluteValue =
    absoluteChangeUsd < 0.01
      ? "<$0.01"
      : `${percentSign}${formatUsd(absoluteChangeUsd, {
          maximumFractionDigits: absoluteChangeUsd >= 1 ? 2 : 4,
        })}`;

  return {
    absoluteValue,
    percentTone:
      asset.change24hPercent > 0
        ? "positive"
        : asset.change24hPercent < 0
          ? "negative"
          : "neutral",
    percentValue: `${percentSign}${percentValue}%`,
  } as const;
}

function resolveAssetMetadata(
  asset: PortfolioAssetSnapshot,
  metadata:
    | {
        asset_identifier?: string | null;
        description?: string | null;
        image_canonical_uri?: string | null;
        image_thumbnail_uri?: string | null;
        image_uri?: string | null;
        name?: string | null;
        symbol?: string | null;
      }
    | null
    | undefined,
) {
  const name = metadata?.name?.trim() || asset.name;
  const symbol = metadata?.symbol?.trim() || asset.symbol;
  const icon =
    asset.icon ??
    metadata?.image_canonical_uri ??
    metadata?.image_uri ??
    metadata?.image_thumbnail_uri ??
    null;

  return {
    ...asset,
    name,
    symbol,
    icon,
    assetIdentifier:
      asset.assetIdentifier ??
      metadata?.asset_identifier ??
      asset.tokenContract,
    description: metadata?.description?.trim() ?? asset.description ?? null,
  } satisfies PortfolioAssetSnapshot;
}

function ActionButton({
  label,
  icon,
  disabled,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <View className="flex-1 items-center gap-2">
      <Button
        variant="iconCircle"
        size="iconCircle"
        leftIcon={icon}
        iconOnly
        disabled={disabled}
        onPress={onPress}
        accessibilityLabel={label}
      />
      <Text
        className={`font-instrument-sans text-xs ${
          disabled ? "text-tertiary" : "text-primary"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

function DetailRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string | null;
}) {
  return (
    <View className="px-4 py-3.5">
      <View className="flex-row items-start gap-3">
        <Text
          className="w-36 font-instrument-sans text-sm text-secondary"
          numberOfLines={1}
        >
          {label}
        </Text>

        <View className="min-w-0 flex-1 flex-row items-start justify-end gap-2">
          <View className="min-w-0 flex-1 items-end">
            {typeof value === "string" ? (
              <Text className="text-right font-instrument-sans-medium text-sm leading-5 text-primary">
                {value}
              </Text>
            ) : (
              value
            )}
          </View>

          {copyValue ? (
            <Pressable
              className="mt-0.5 h-6 w-6 items-center justify-center"
              hitSlop={8}
              onPress={() =>
                void copyToClipboard(copyValue, "Contract details copied")
              }
              accessibilityRole="button"
              accessibilityLabel={`Copy ${label}`}
            >
              <Copy size={12} color="#595754" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function EarnAssetDetailSkeleton() {
  return (
    <View className="gap-4">
      <View className="rounded-[20px] border border-surface-secondary bg-sand-50 px-4 py-5">
        <View className="items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-7 w-28 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
          <View className="items-center gap-2">
            <Skeleton className="h-10 w-36 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </View>
        </View>
        <View className="mt-5 flex-row gap-3">
          {[0, 1, 2, 3].map((index) => (
            <View key={index} className="flex-1 items-center gap-2">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-10 rounded" />
            </View>
          ))}
        </View>
      </View>

      <View className="rounded-[20px] border border-surface-secondary bg-sand-50 px-4 py-4">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="mt-3 h-4 w-full rounded" />
        <Skeleton className="mt-2 h-4 w-5/6 rounded" />
      </View>

      <View className="overflow-hidden rounded-[20px] border border-surface-secondary bg-sand-50">
        {[0, 1, 2, 3].map((index) => (
          <View key={index}>
            {index > 0 ? (
              <View className="mx-4 h-px bg-border-secondary" />
            ) : null}
            <View className="flex-row items-center justify-between gap-4 px-4 py-3.5">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function EarnAssetDetail() {
  const router = useRouter();
  const { assetId } = useLocalSearchParams<{ assetId?: string | string[] }>();
  const { isBalanceVisible } = useBalanceVisibility();
  const { openTransfer } = useTransferSheet();
  const { openTransak } = useTransak();
  const { openSwap } = useSwapSheet();
  const portfolio = usePortfolioBalance();
  const selectedAssetId = getRouteParam(assetId) ?? "";
  const isPortfolioInitialLoading =
    portfolio.isBalanceLoading && portfolio.assets.length === 0;

  const asset = useMemo(
    () =>
      portfolio.assets.find((candidate) => candidate.id === selectedAssetId) ??
      null,
    [portfolio.assets, selectedAssetId],
  );

  const metadataQuery = useFtMetadataMap({
    variables: {
      principals: asset?.tokenContract ? [asset.tokenContract] : [],
    },
    enabled: !!asset?.tokenContract,
  });

  const metadata = asset?.tokenContract
    ? (metadataQuery.data?.[asset.tokenContract.toLowerCase()] ?? null)
    : null;
  const resolvedAsset = useMemo(
    () => (asset ? resolveAssetMetadata(asset, metadata) : null),
    [asset, metadata],
  );

  const actionAvailability = resolvedAsset
    ? getPortfolioAssetActionAvailability(resolvedAsset)
    : { send: false, receive: false, buy: false, swap: false };
  const valueDisplay = maskValue(
    formatUsd(resolvedAsset?.valueUsd ?? null),
    isBalanceVisible,
  );
  const amountDisplay = resolvedAsset
    ? maskValue(
        `${formatPortfolioTokenAmount(
          resolvedAsset.amount,
          resolvedAsset.displayDecimals,
        )} ${resolvedAsset.symbol}`,
        isBalanceVisible,
      )
    : "—";
  const detailDisplay = resolvedAsset?.detail
    ? `${resolvedAsset.detail.label} ${maskValue(
        resolvedAsset.detail.value,
        isBalanceVisible,
      )}`
    : null;

  const handleSend = useCallback(() => {
    if (!resolvedAsset) return;

    const transferAsset = getPortfolioAssetTransferAsset(resolvedAsset);
    if (!transferAsset) return;

    openTransfer({
      mode: "send",
      send: {
        asset: transferAsset,
        locks: {
          asset: true,
        },
      },
    });
  }, [openTransfer, resolvedAsset]);

  const handleReceive = useCallback(() => {
    if (!resolvedAsset) return;

    const transferAsset = getPortfolioAssetTransferAsset(resolvedAsset);
    if (!transferAsset) return;

    openTransfer({
      mode: "receive",
      receive: {
        asset: transferAsset,
      },
    });
  }, [openTransfer, resolvedAsset]);

  const handleBuy = useCallback(() => {
    if (!resolvedAsset) return;

    const buyAsset = getPortfolioAssetBuyAsset(resolvedAsset);
    if (!buyAsset) return;

    openTransak(buyAsset, "buy");
  }, [openTransak, resolvedAsset]);

  const handleSwap = useCallback(() => {
    if (!resolvedAsset?.swapTokenId) return;

    openSwap({
      sourceTokenId: resolvedAsset.swapTokenId,
    });
  }, [openSwap, resolvedAsset?.swapTokenId]);

  if (!resolvedAsset && isPortfolioInitialLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface-tertiary" edges={[]}>
        <ScrollView
          className="px-4"
          contentContainerStyle={{ paddingTop: 18, paddingBottom: 32 }}
        >
          <EarnAssetDetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!resolvedAsset) {
    return (
      <SafeAreaView className="flex-1 bg-surface-tertiary" edges={[]}>
        <View className="flex-1 px-4 py-6">
          <View className="rounded-[20px] border border-surface-secondary bg-sand-50 px-5 py-6">
            <Text className="font-matter text-2xl leading-7 text-primary">
              Asset unavailable
            </Text>
            <Text className="mt-2 font-instrument-sans text-sm leading-5 text-secondary">
              This token is not currently available in your portfolio.
            </Text>
            <Button
              label="Back to Earn"
              variant="outline"
              className="mt-5 self-start"
              onPress={() => router.push("/Earn")}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const contractDetailsValue =
    resolvedAsset.assetIdentifier ?? resolvedAsset.tokenContract ?? null;
  const priceChangeDisplay = getAssetPriceChangeDisplay(resolvedAsset);
  const layerLabel = getPortfolioAssetLayerLabel(resolvedAsset);
  const details = [
    {
      label: "Name",
      value: getPortfolioAssetDisplayName(resolvedAsset),
    },
    {
      label: "Price",
      value: formatAssetUnitPrice(resolvedAsset.unitPriceUsd),
    },
    {
      label: "Price change (24hr)",
      value: priceChangeDisplay ? (
        <View className="items-end">
          <Text
            className="text-right font-instrument-sans-medium text-sm leading-5 text-primary"
            numberOfLines={1}
          >
            <Text
              className={
                priceChangeDisplay.percentTone === "positive"
                  ? "text-green-600"
                  : priceChangeDisplay.percentTone === "negative"
                    ? "text-red-600"
                    : "text-primary"
              }
            >
              {priceChangeDisplay.percentValue}
            </Text>
            <Text className="text-secondary">
              {` (${priceChangeDisplay.absoluteValue})`}
            </Text>
          </Text>
        </View>
      ) : (
        "Unavailable"
      ),
    },
    {
      label: "Layer",
      value: layerLabel,
    },
    {
      label: "Contract details",
      value: contractDetailsValue
        ? formatContractIdentifier(contractDetailsValue)
        : "Native asset",
      copyValue: contractDetailsValue,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface-tertiary" edges={[]}>
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingTop: 18, paddingBottom: 32, gap: 18 }}
      >
        <View className="rounded-[20px] border border-surface-secondary bg-sand-50 px-4 py-5">
          <View className="items-center gap-3">
            <TokenAvatar
              symbol={resolvedAsset.symbol}
              icon={resolvedAsset.icon}
              size={56}
            />

            <View className="items-center gap-1.5">
              <Text className="font-instrument-sans-semibold text-3xl leading-tight text-primary">
                {amountDisplay}
              </Text>
              {detailDisplay ? (
                <Text className="font-instrument-sans text-sm text-secondary">
                  {detailDisplay}
                </Text>
              ) : null}
              <Text className="font-instrument-sans text-lg text-secondary">
                {valueDisplay}
              </Text>
            </View>
          </View>

          <View className="mt-5 flex-row gap-3">
            <ActionButton
              label="Send"
              icon={<ArrowUpRight size={16} color="#0B0A0F" />}
              disabled={!actionAvailability.send}
              onPress={handleSend}
            />
            <ActionButton
              label="Receive"
              icon={<ArrowDownLeft size={16} color="#0B0A0F" />}
              disabled={!actionAvailability.receive}
              onPress={handleReceive}
            />
            <ActionButton
              label="Buy"
              icon={<CreditCard size={16} color="#0B0A0F" />}
              disabled={!actionAvailability.buy}
              onPress={handleBuy}
            />
            <ActionButton
              label="Swap"
              icon={<SwapActionIcon size={16} color="#0B0A0F" />}
              disabled={!actionAvailability.swap}
              onPress={handleSwap}
            />
          </View>
        </View>

        <View className="rounded-[20px] border border-surface-secondary bg-sand-50 px-4 py-4">
          <Text className="font-instrument-sans-semibold text-sm text-secondary">
            About
          </Text>
          <Text className="mt-2 font-instrument-sans text-sm leading-6 text-primary">
            {getPortfolioAssetDescription(resolvedAsset)}
          </Text>
        </View>

        <View className="overflow-hidden rounded-[20px] border border-surface-secondary bg-sand-50">
          <View className="px-4 pb-1 pt-4">
            <Text className="font-instrument-sans-semibold text-sm text-secondary">
              Token details
            </Text>
          </View>

          {details.map((detail, index) => (
            <View key={detail.label}>
              {index > 0 ? (
                <View className="mx-4 h-px bg-border-secondary" />
              ) : null}
              <DetailRow
                label={detail.label}
                value={detail.value}
                copyValue={detail.copyValue}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
