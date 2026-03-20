import { ArrowUpDown, ChevronDown } from "lucide-react-native";
import { Pressable, StyleSheet, TextInput } from "react-native";

import { Button, Text, View, colors } from "@/components/ui";
import type { SwapViewModel } from "../hooks/use-swap";
import type { SwapAsset } from "../types";
import { TokenAvatar } from "../components/token-avatar";

type SwapFormViewProps = {
  swap: SwapViewModel;
};

function formatAvailableBalance(token: SwapAsset | null) {
  if (!token) return undefined;
  return `Available: ${token.balanceDisplay}`;
}

function SwapSection({
  label,
  token,
  amount,
  editable,
  usdLabel,
  availableLabel,
  action,
  onSelectToken,
  onAmountChange,
}: {
  label: string;
  token: SwapAsset | null;
  amount: string;
  editable?: boolean;
  usdLabel?: string;
  availableLabel?: string;
  action?: React.ReactNode;
  onSelectToken: () => void;
  onAmountChange?: (value: string) => void;
}) {
  return (
    <View className="gap-3 px-4 py-5">
      <View
        className="flex-row items-center justify-between"
        style={{ minHeight: 28 }}
      >
        <Text className="font-instrument-sans-semibold text-sm text-secondary">
          {label}
        </Text>
        {action}
      </View>

      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          {editable ? (
            <TextInput
              className="p-0 font-matter text-primary"
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.neutral[300]}
              selectionColor={colors.neutral[900]}
              value={amount}
              onChangeText={onAmountChange}
              style={{
                paddingVertical: 0,
                fontSize:
                  amount.length > 12
                    ? 20
                    : amount.length > 8
                      ? 26
                      : amount.length > 5
                        ? 30
                        : 36,
                lineHeight:
                  amount.length > 12
                    ? 26
                    : amount.length > 8
                      ? 32
                      : amount.length > 5
                        ? 36
                        : 42,
              }}
            />
          ) : (
            <Text
              className="font-matter text-[36px] leading-[42px] text-primary"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.55}
            >
              {amount || "0"}
            </Text>
          )}
        </View>

        <Pressable onPress={onSelectToken}>
          <View className="flex-row items-center gap-2 rounded-full border-2 border-border-secondary px-2.5 py-1.5">
            <TokenAvatar
              icon={token?.icon}
              symbol={token?.symbol ?? "?"}
              size={22}
            />
            <Text className="font-matter text-[15px] text-primary">
              {token?.symbol ?? "Select"}
            </Text>
            <ChevronDown size={13} color={colors.neutral[500]} />
          </View>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="font-instrument-sans text-sm text-secondary">
          {usdLabel ?? "~$0.00"}
        </Text>
        <Text
          className="text-right font-instrument-sans text-sm text-secondary"
          numberOfLines={1}
        >
          {availableLabel ?? ""}
        </Text>
      </View>
    </View>
  );
}

function SwapCard({
  swap,
  receiveAmount,
  sourceUsdLabel,
  receiveUsdLabel,
}: {
  swap: SwapViewModel;
  receiveAmount: string;
  sourceUsdLabel?: string;
  receiveUsdLabel?: string;
}) {
  const sourceAvailable = formatAvailableBalance(swap.sourceToken);
  const destinationAvailable = swap.destinationToken
    ? formatAvailableBalance(swap.destinationToken)
    : swap.destinationEmptyState;

  return (
    <View className="overflow-hidden rounded-[20px] border border-border-secondary bg-sand-100 mb-4">
      <SwapSection
        label="You're paying"
        token={swap.sourceToken}
        amount={swap.amountInput}
        editable
        usdLabel={sourceUsdLabel}
        availableLabel={sourceAvailable}
        onSelectToken={swap.onOpenSourceSelector}
        onAmountChange={swap.onAmountChange}
        action={
          <Button
            label="Max"
            variant="outline"
            size="sm"
            onPress={swap.onMax}
            className="rounded-lg border-2 border-border-secondary bg-transparent"
            textClassName="text-xs font-instrument-sans-medium text-secondary"
          />
        }
      />

      <View className="flex-row items-center px-4">
        <View className="h-px flex-1 bg-surface-secondary" />
        <Pressable style={styles.flipButton} onPress={swap.onFlip}>
          <ArrowUpDown size={14} color={colors.secondary} />
        </Pressable>
        <View className="h-px flex-1 bg-surface-secondary" />
      </View>

      <SwapSection
        label="To receive"
        token={swap.destinationToken}
        amount={receiveAmount}
        usdLabel={receiveUsdLabel}
        availableLabel={destinationAvailable}
        onSelectToken={swap.onOpenDestinationSelector}
      />
    </View>
  );
}

export function SwapFormView({ swap }: SwapFormViewProps) {
  const receiveAmount =
    swap.destinationToken && swap.minimumReceivedLabel
      ? swap.minimumReceivedLabel
      : "";

  const sourceUsdLabel =
    swap.sourceToken?.usdPrice &&
    swap.amountInput &&
    parseFloat(swap.amountInput) > 0
      ? `~$${(parseFloat(swap.amountInput) * swap.sourceToken.usdPrice).toFixed(2)}`
      : undefined;

  const receiveUsdLabel =
    swap.destinationToken?.usdPrice &&
    swap.minimumReceivedLabel &&
    parseFloat(swap.minimumReceivedLabel) > 0
      ? `~$${(
          parseFloat(swap.minimumReceivedLabel) * swap.destinationToken.usdPrice
        ).toFixed(2)}`
      : undefined;

  return (
    <>
      <SwapCard
        swap={swap}
        receiveAmount={receiveAmount}
        sourceUsdLabel={sourceUsdLabel}
        receiveUsdLabel={receiveUsdLabel}
      />

      <Button
        label={swap.isQuoteLoading ? "Finding route..." : "Swap"}
        variant="gamePrimary"
        size="lg"
        onPress={swap.onReview}
        disabled={!swap.canContinue}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flipButton: {
    height: 32,
    width: 32,
    borderRadius: 8,
    backgroundColor: "#EAE8E6",
    borderWidth: 2,
    borderColor: "#D5D3D1",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
});
