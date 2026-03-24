import React from "react";
import { View, ActivityIndicator } from "react-native";
import { TokenAvatar, colors } from "@/components/ui";
import { Numpad } from "@/components/ui/numpad";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
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
}

export function TransakDrawerLayout({
  isCheckout,
  checkoutUrl,
  transakConfig,
  onTransakEvent,
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
    return (
      <View
        className="flex-1 bg-[#f2f2f2]"
        style={{ paddingBottom: bottomInset }}
      >
        <View className="flex-1">
          {checkoutUrl ? (
            <TransakWebView
              transakConfig={transakConfig}
              onTransakEvent={onTransakEvent}
              style={{ flex: 1 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <BottomSheetScrollView
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: bottomInset + 24,
      }}
    >
      <View className="flex-1 px-5">
        <View className="flex-1 justify-start gap-6">
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
          <View>
            <Numpad value={amount} onChange={onAmountChange} mode="decimal" />
          </View>
        </View>
      </View>
    </BottomSheetScrollView>
  );
}
