import { ArrowDown, ArrowDownUp } from "lucide-react-native";

import { BtcDarkerLogo, Pressable, Text, View, colors } from "@/components/ui";
import { BtcRouteLogo } from "@/components/ui/icons/btc-route-logo";
import { SbtcRouteLogo } from "@/components/ui/icons/sbtc-route-logo";
import { StacksRouteLogo } from "@/components/ui/icons/stacks-route-logo";

function AssetIcons({ asset }: { asset: "btc" | "stacks" }) {
  if (asset === "btc") {
    return (
      <View className="flex-row items-center">
        <BtcDarkerLogo size={30} style={{ marginRight: -5, zIndex: 1 }} />
        <BtcRouteLogo size={30} />
      </View>
    );
  }
  return (
    <View className="flex-row items-center">
      <StacksRouteLogo size={30} style={{ marginRight: -5, zIndex: 1 }} />
      <SbtcRouteLogo size={30} />
    </View>
  );
}

function AssetCard({
  direction,
  label,
  ticker,
  asset,
}: {
  direction: "From" | "To";
  label: string;
  ticker: string;
  asset: "btc" | "stacks";
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-[12px] bg-surface-primary px-4 py-3.5">
      <AssetIcons asset={asset} />
      <View>
        <Text className="font-instrument-sans-semibold text-xs text-sand-500">
          {direction}
        </Text>
        <View className="flex-row items-baseline gap-1">
          <Text className="font-matter text-lg text-primary">{label}</Text>
          <Text className="font-instrument-sans text-xs text-secondary">
            ({ticker})
          </Text>
        </View>
      </View>
    </View>
  );
}

export function BridgeRouteCard({
  isDeposit,
  actionIcon = "swap",
  onSwap,
}: {
  isDeposit: boolean;
  actionIcon?: "swap" | "down";
  onSwap?: () => void;
}) {
  const actionButtonStyle = {
    position: "absolute" as const,
    top: "50%" as const,
    right: -22,
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#EAE8E6",
    borderWidth: 2,
    borderColor: "#D5D3D1",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  return (
    <View className="mr-2">
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: -12,
          height: "50%",
          marginTop: "25%",
          left: -1,
          borderTopWidth: 1,
          borderRightWidth: 1,
          borderBottomWidth: 1,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
          borderColor: "#D5D3D1",
        }}
      />

      <AssetCard
        direction="From"
        label={isDeposit ? "Bitcoin" : "Stacks"}
        ticker={isDeposit ? "BTC" : "sBTC"}
        asset={isDeposit ? "btc" : "stacks"}
      />
      <View className="h-2" />
      <AssetCard
        direction="To"
        label={isDeposit ? "Stacks" : "Bitcoin"}
        ticker={isDeposit ? "sBTC" : "BTC"}
        asset={isDeposit ? "stacks" : "btc"}
      />

      {actionIcon === "swap" ? (
        <Pressable
          onPress={onSwap}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Swap direction"
          style={actionButtonStyle}
        >
          <ArrowDownUp size={12} color={colors.secondary} />
        </Pressable>
      ) : (
        <View pointerEvents="none" style={actionButtonStyle}>
          <ArrowDown size={12} color={colors.secondary} />
        </View>
      )}
    </View>
  );
}
