import { colors, Text } from "@/components/ui";
import Chart from "@/components/ui/chart";
import formatCurrency from "@/lib/format/currency";
import { maskDisplayValue } from "@/lib/format/mask-display-value";
import { useBalanceVisibility } from "@/lib/store/balance-visibility";
import { ChevronRight, Eye, EyeOff } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, View } from "react-native";

interface PortfolioSummaryProps {
  balance: number;
  onPress: () => void;
}

const PortfolioSummary = ({ balance, onPress }: PortfolioSummaryProps) => {
  const { isBalanceVisible, toggleBalanceVisibility } = useBalanceVisibility();
  const hasBalance = balance > 0;
  const { dollars, cents } = useMemo(() => {
    const formatted = formatCurrency(balance);

    if (isBalanceVisible) return formatted;

    return {
      dollars: maskDisplayValue(formatted.dollars),
      cents: maskDisplayValue(formatted.cents),
    };
  }, [balance, isBalanceVisible]);
  return (
    <View className="rounded-xl flex-row justify-between items-end">
      <View className="flex-1">
        <View className="flex-row items-center mb-2">
          <Text className="text-xl">Portfolio</Text>
          <Pressable
            onPress={() => {
              void toggleBalanceVisibility();
            }}
            className="p-2 -mr-2"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              isBalanceVisible ? "Hide balances" : "Show balances"
            }
          >
            {isBalanceVisible ? (
              <EyeOff color={colors.neutral[600]} size={16} />
            ) : (
              <Eye color={colors.neutral[600]} size={16} />
            )}
          </Pressable>
        </View>
        <View className="flex-row items-baseline gap-1">
          <Text className="text-5xl font-instrument-sans-semibold text-primary">
            {dollars}
          </Text>
          <Text className="text-3xl font-instrument-sans-semibold text-tertiary">
            {cents}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onPress}
        className="flex-col items-end active:opacity-70 gap-1"
      >
        <ChevronRight color={colors.neutral[400]} size={20} />
        <View className="mr-2">
          <Chart hasBalance={hasBalance} />
        </View>
      </Pressable>
    </View>
  );
};

export default PortfolioSummary;
