import React from "react";
import { View } from "react-native";
import { TokenAvatar, Spinner, Text, colors } from "@/components/ui";
import { Numpad } from "@/components/ui/numpad";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import {
  TransakWebView,
  type OnTransakEvent,
  type TransakConfig,
} from "@transak/ui-expo-sdk";
import type { AssetOption } from "../types";
import { AssetSelector } from "../components/asset-selector";
import { TransakAmountDisplay } from "../components/transak-amount-display";

const ASSET_OPTIONS: {
  id: AssetOption;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  visible?: boolean;
}[] = [
  {
    id: "STX",
    label: "Stacks",
    icon: <TokenAvatar symbol="STX" size={24} />,
    visible: true,
  },
  {
    id: "BTC",
    label: "Bitcoin",
    icon: <TokenAvatar symbol="BTC" size={24} />,
    visible: true,
  },
  // { id: "USDC", label: "USDC", icon: <UsdcLogo size={24} />, visible: false },
];

export interface TransakDrawerLayoutProps {
  isCheckout: boolean;
  checkoutUrl: string | null;
  transakConfig: TransakConfig;
  onTransakEvent: OnTransakEvent;
  isWidgetInitialized: boolean;
  /** Form only */
  asset: AssetOption;
  amount: string;
  action: "buy" | "sell";
  onAssetSelect: (asset: AssetOption) => void;
  onAmountChange: (value: string) => void;
  /** Quote display */
  isLoadingQuote: boolean;
  quoteAmount: number | null;
  quoteUnit: string;
  quoteError: boolean;
  quoteMessage?: string;
  isValidAmount: boolean;
  availableBalance: number;
  bottomInset: number;
  footer?: React.ReactNode;
}

export function TransakDrawerLayout({
  isCheckout,
  checkoutUrl,
  transakConfig,
  onTransakEvent,
  isWidgetInitialized,
  asset,
  amount,
  action,
  onAssetSelect,
  onAmountChange,
  isLoadingQuote,
  quoteAmount,
  quoteUnit,
  quoteError,
  quoteMessage,
  isValidAmount,
  availableBalance,
  bottomInset,
  footer,
}: TransakDrawerLayoutProps) {
  const visibleAssets = ASSET_OPTIONS.filter(
    (a) => a.visible && !(action === "sell" && a.id === "STX"),
  ).map(({ id, label, icon, disabled }) => ({
    id,
    label,
    icon,
    disabled,
  }));

  if (isCheckout) {
    const isLoadingCheckout = !checkoutUrl || !isWidgetInitialized;

    return (
      <View className="flex-1 bg-white" style={{ paddingBottom: bottomInset }}>
        <View className="flex-1 bg-white">
          {checkoutUrl ? (
            <TransakWebView
              transakConfig={transakConfig}
              onTransakEvent={onTransakEvent}
              style={{ flex: 1 }}
            />
          ) : null}
          {isLoadingCheckout ? (
            <View className="absolute inset-0 items-center justify-center gap-4 bg-white px-6">
              <Spinner
                color={colors.stacks.bloodOrange}
                size={42}
                trackColor={colors.neutral[200]}
              />
              <View className="items-center">
                <Text className="text-center font-matter text-xl text-primary">
                  Loading checkout
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <BottomSheetView style={{ paddingTop: 8 }}>
      <View className="px-5 gap-6">
        <View>
          <AssetSelector
            options={visibleAssets}
            selectedAsset={asset}
            onSelect={onAssetSelect}
          />
          <TransakAmountDisplay
            action={action}
            amount={amount}
            asset={asset}
            isLoadingQuote={isLoadingQuote}
            quoteAmount={quoteAmount}
            quoteUnit={quoteUnit}
            quoteError={quoteError}
            quoteMessage={quoteMessage}
            isValidAmount={isValidAmount}
            availableBalance={availableBalance}
          />
        </View>
        <Numpad value={amount} onChange={onAmountChange} mode="decimal" />
      </View>
      <View style={{ paddingTop: 16, paddingBottom: bottomInset }}>
        {footer}
      </View>
    </BottomSheetView>
  );
}
