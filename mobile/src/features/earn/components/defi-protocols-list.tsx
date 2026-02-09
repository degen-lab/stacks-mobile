import { useRouter } from "expo-router";
import { View, colors } from "@/components/ui";
import { EarnCard } from "./earn-card";

const DEFI_PROTOCOLS = [
  {
    id: "stack-stx",
    title: "Stack STX",
    description: "Lock STX and earn Bitcoin every ~2 weeks",
    imageSource: require("@/assets/images/stx-bitcoin.svg"),
    imageSize: { width: 73, height: 40 },
    borderGradient: colors.stacks.bitcoinCardStroke,
    fillGradient: colors.stacks.menuFillBottom,
  },
  {
    id: "dual-stacking",
    title: "Dual Stacking",
    description: "Hold sBTC & boost with STX Stacking or DeFi",
    imageSource: require("@/assets/images/sbtc-stx-btc.svg"),
    imageSize: { width: 131, height: 40 },
    borderGradient: colors.stacks.gameCardStroke,
    fillGradient: colors.stacks.gameCardFillRight,
  },
] as const;

export function DeFiProtocolsList() {
  const router = useRouter();

  const handleProtocolPress = (id: string) => {
    if (id === "stack-stx") {
      router.push("/Earn/stacking");
    } else {
      router.push("/Earn/dual-stacking");
    }
  };

  return (
    <View className="flex-row gap-3 w-full">
      {DEFI_PROTOCOLS.map((protocol) => (
        <View key={protocol.id} style={{ flex: 1 }}>
          <EarnCard
            title={protocol.title}
            description={protocol.description}
            imageSource={protocol.imageSource}
            imageSize={protocol.imageSize}
            borderGradient={protocol.borderGradient}
            fillGradient={protocol.fillGradient}
            onPress={() => handleProtocolPress(protocol.id)}
          />
        </View>
      ))}
    </View>
  );
}
