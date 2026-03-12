import { View, ActivityIndicator } from "react-native";
import { Text, colors } from "@/components/ui";
import type { AssetOption } from "../types";

type Props = {
  action: "buy" | "sell";
  amount: string;
  asset: AssetOption;
  isLoadingQuote: boolean;
  quoteAmount: number | null;
  quoteUnit: string;
  quoteError: boolean;
  quoteMessage?: string;
  isValidAmount: boolean;
  availableBalance: number;
};

export function TransakAmountDisplay({
  action,
  amount,
  asset,
  isLoadingQuote,
  quoteAmount,
  quoteUnit,
  quoteError,
  quoteMessage,
  isValidAmount,
  availableBalance,
}: Props) {
  const isSell = action === "sell";
  const availableBalanceLabel =
    asset === "BTC" ? availableBalance.toFixed(8) : availableBalance.toFixed(2);
  const formattedQuote =
    quoteAmount !== null
      ? quoteUnit === "USD"
        ? quoteAmount.toFixed(2)
        : quoteAmount.toFixed(4)
      : null;

  return (
    <View className="mb-6 items-center">
      <Text className="font-instrument-sans text-secondary text-base mb-2">
        {action === "buy" ? "I want to buy" : "I want to sell"}
      </Text>
      <View className="flex-row items-center justify-center h-16">
        {!isSell && (
          <Text className="font-matter text-4xl text-primary mr-1">$</Text>
        )}
        <Text
          className={`font-matter text-5xl text-primary ${
            !amount ? "text-neutral-300" : ""
          }`}
        >
          {amount || "0"}
        </Text>
        {isSell && (
          <Text className="font-matter text-2xl text-primary ml-2">
            {asset}
          </Text>
        )}
      </View>
      <View className="items-center mt-2">
        <View className="h-6 justify-center">
          {isLoadingQuote ? (
            <ActivityIndicator size="small" color={colors.neutral[400]} />
          ) : quoteMessage ? (
            <Text className="font-instrument-sans text-secondary text-sm">
              {quoteMessage}
            </Text>
          ) : formattedQuote !== null ? (
            <Text className="font-instrument-sans text-secondary text-sm">
              ≈ {formattedQuote} {quoteUnit}
            </Text>
          ) : quoteError && isValidAmount ? (
            <Text className="font-instrument-sans text-red-500 text-sm">
              Unable to fetch quote
            </Text>
          ) : (
            <Text className="font-instrument-sans text-secondary text-sm">
              ≈ 0.00 {quoteUnit} (est.)
            </Text>
          )}
        </View>
        {action === "sell" && (
          <View className="mt-1">
            <Text className="font-instrument-sans text-secondary text-xs">
              Available: {availableBalanceLabel} {asset}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
