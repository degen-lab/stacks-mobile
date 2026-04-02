import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { BalanceBtcIcon } from "@/components/ui/icons";
import { formatNumberToEnUs } from "../../cards/shared/utils";
import type { PortfolioValue } from "./chart/types";

type Props = {
  value: PortfolioValue;
};

export function PortfolioValueDisplay({ value }: Props) {
  return (
    <View>
      <Text className="font-instrument-sans-medium text-secondary text-base">
        Total portfolio value
      </Text>
      <Text className="font-matter text-primary text-2xl mt-1">
        ${formatNumberToEnUs(value.usd)}
      </Text>
      <View className="mt-1 flex-row items-center gap-1">
        <BalanceBtcIcon width={16} height={16} color="#C97B0A" />
        <Text className="font-instrument-sans-medium text-sm">
          ≈ {value.btc.toFixed(5)} BTC
        </Text>
      </View>
    </View>
  );
}
