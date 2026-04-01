import { ArrowDown } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { ActivityIndicator } from "react-native";

import { TransactionFundingActions } from "@/components/transaction-funding-actions";
import { Text, TokenAvatar, View, colors } from "@/components/ui";
import { Toggle } from "@/components/ui/toggle";
import type { SwapViewModel } from "../hooks/use-swap";

type SwapReviewViewProps = {
  swap: SwapViewModel;
};

const FEE_OPTIONS = [
  { value: "low" as const, label: "Low" },
  { value: "standard" as const, label: "Standard" },
  { value: "high" as const, label: "High" },
];

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="font-instrument-sans text-sm text-secondary">
        {label}
      </Text>
      <Text className="max-w-[56%] text-right font-instrument-sans text-sm text-primary">
        {value}
      </Text>
    </View>
  );
}

function SwapTokenRow({
  icon,
  symbol,
  label,
  amount,
}: {
  icon: string | null | undefined;
  symbol: string | undefined;
  label: string;
  amount: string | null | undefined;
}) {
  return (
    <View className="flex-row items-center gap-3.5 px-5 py-5">
      <TokenAvatar icon={icon} symbol={symbol ?? "?"} size={40} />
      <View className="flex-1">
        <Text className="font-instrument-sans text-sm text-secondary">
          {label}
        </Text>
        <Text
          className="font-matter text-xl text-primary"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {amount ?? "—"} {symbol}
        </Text>
      </View>
    </View>
  );
}

export function SwapReviewView({ swap }: SwapReviewViewProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const sourceBalanceLabel = swap.sourceToken
    ? `${swap.sourceToken.balanceDisplay} ${swap.sourceToken.symbol}`
    : "—";
  const destinationBalanceLabel = swap.destinationToken
    ? `${swap.destinationToken.balanceDisplay} ${swap.destinationToken.symbol}`
    : "—";

  return (
    <>
      <View className="overflow-hidden rounded-2xl border border-border-secondary bg-sand-100 dark:border-border-primary dark:bg-surface-primary">
        <SwapTokenRow
          icon={swap.sourceToken?.icon}
          symbol={swap.sourceToken?.symbol}
          label="You pay"
          amount={swap.amountInput || null}
        />

        <View className="flex-row items-center px-5">
          <View className="mx-3">
            <ArrowDown
              size={14}
              color={isDark ? colors.charcoal[400] : colors.neutral[400]}
            />
          </View>
          <View className="h-px flex-1 bg-surface-secondary dark:bg-border-primary" />
        </View>

        <SwapTokenRow
          icon={swap.destinationToken?.icon}
          symbol={swap.destinationToken?.symbol}
          label="You receive at least"
          amount={swap.minimumReceivedLabel}
        />
      </View>

      <View className="gap-3 rounded-2xl border border-border-secondary bg-sand-100 px-5 py-4 dark:border-border-primary dark:bg-surface-primary">
        <SummaryRow label="Current balance" value={sourceBalanceLabel} />
        <SummaryRow
          label="Destination balance"
          value={destinationBalanceLabel}
        />
        <View className="flex-row items-center justify-between">
          <Text className="font-instrument-sans text-sm text-secondary">
            Network fee
          </Text>
          {swap.isLoadingWalletFee ? (
            <ActivityIndicator
              size="small"
              color={isDark ? colors.charcoal[400] : colors.neutral[400]}
            />
          ) : (
            <Text className="font-instrument-sans text-sm text-primary">
              {swap.walletFeeLabel}
            </Text>
          )}
        </View>
        {swap.isLoadingWalletFee ? null : (
          <View className="flex-row ml-auto">
            <Toggle
              value={swap.selectedFeeOption}
              options={FEE_OPTIONS}
              onChange={swap.onFeeOptionChange}
            />
          </View>
        )}
      </View>

      {swap.stepError ? (
        <Text className="px-1 font-instrument-sans text-xs text-danger-600">
          {swap.stepError}
        </Text>
      ) : null}

      <TransactionFundingActions
        walletLabel="Use wallet funds"
        onPressWallet={() => {
          void swap.onConfirm();
        }}
        walletDisabled={!swap.canSubmitWallet}
        walletLoading={swap.isExecuting}
        onPressSponsored={() => {
          void swap.onSponsoredConfirm();
        }}
        sponsoredDisabled={!swap.canSubmitSponsored}
        sponsoredLoading={swap.isSubmittingSponsored}
      />
    </>
  );
}
