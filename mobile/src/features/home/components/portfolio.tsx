import { colors, Text } from "@/components/ui";
import Chart from "@/components/ui/chart";
import formatCurrency from "@/lib/format/currency";
import { ChevronRight, Eye, EyeOff } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";

interface PortfolioSummaryProps {
  balance: number;
  onPress: () => void;
}

const PortfolioSummary = ({ balance, onPress }: PortfolioSummaryProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const hasBalance = balance > 0;
  const { dollars, cents } = useMemo(() => {
    if (!isVisible) {
      return { dollars: "----", cents: ".--" };
    }

    return formatCurrency(balance);
  }, [balance, isVisible]);
  return (
    <View className="rounded-xl flex-row justify-between items-end">
      <View className="flex-1">
        <View className="flex-row items-center mb-2">
          <Text className="text-xl">Portfolio</Text>
          <Pressable
            onPress={() => setIsVisible((prev) => !prev)}
            className="p-2 -mr-2"
            hitSlop={8}
          >
            {isVisible ? (
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
