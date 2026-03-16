import { View, StyleSheet } from "react-native";
import { Image } from "@/components/ui";
import { Text } from "@/components/ui/text";
import type { EarningsData } from "./chart/types";

type Props = {
  earnings: EarningsData;
};

export function EarningsDisplay({ earnings }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text
          className="font-instrument-sans-medium text-sm"
          style={{ color: "#7B7775" }}
        >
          {earnings.description}
        </Text>
        <View className="mt-1 flex-row flex-wrap items-baseline gap-2">
          <Text className="font-matter text-2xl" style={{ color: "#303030" }}>
            {earnings.amount.toFixed(8)} sBTC
          </Text>
          <Text className="font-matter text-lg" style={{ color: "#95918C" }}>
            (${earnings.usdValue.toLocaleString("en-US")})
          </Text>
        </View>
      </View>

      <Image
        source={require("@/assets/images/portfolio_sbtc.svg")}
        style={styles.image}
        contentFit="contain"
        className="absolute bottom-0 -right-1"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F3F2F0",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  image: {
    width: 100,
    height: 60,
    opacity: 1,
  },
});
