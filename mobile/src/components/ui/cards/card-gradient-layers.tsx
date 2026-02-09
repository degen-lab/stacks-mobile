import { Copy } from "lucide-react-native";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";

import { Text } from "../text";
import { GradientBorderMultiple } from "@/components/ui/gradient-border-multiple";
import { copyToClipboard } from "@/lib/clipboard";

type ReferralCodeCardProps = {
  referralCode?: string;
  hasReferralCode: boolean;
  borderRadius?: number;
  innerBackground?: string;
  containerStyle?: StyleProp<ViewStyle>;
  onCopied?: () => void;
};

// UI preset
const BLOOD_ORANGE_LAYERS = [
  {
    thickness: 6,
    angle: 90,
    colors: ["rgba(255,153,92,0.25)", "rgba(255,153,92,0.05)"],
  },
  {
    thickness: 6,
    angle: 90,
    colors: ["rgba(255,186,140,0.60)", "rgba(255,220,195,0.20)"],
  },
] as const;
export function CardGradientLayers({
  referralCode = "",
  hasReferralCode,
  borderRadius = 0,
  innerBackground = "#F8F4EF",
  containerStyle,
  onCopied,
}: ReferralCodeCardProps) {
  const handleCopy = async () => {
    if (!hasReferralCode) return;
    await copyToClipboard(referralCode, "Code copied!");
    onCopied?.();
  };

  return (
    <View style={containerStyle}>
      {/* label OUTSIDE */}
      <View className="mb-2 flex-row items-end justify-between px-2">
        <Text className="text-primary font-matter text-xl">Referral code</Text>
      </View>

      <GradientBorderMultiple
        layers={BLOOD_ORANGE_LAYERS}
        borderRadius={borderRadius}
        innerBackground={innerBackground}
        contentStyle={{ padding: 0 }}
      >
        <Pressable
          onPress={handleCopy}
          disabled={!hasReferralCode}
          className={`rounded-2xl bg-sand-100 p-4 active:opacity-90 ${
            hasReferralCode ? "" : "opacity-70"
          }`}
        >
          <View className="rounded-xl bg-sand-200 px-3 py-3">
            <View className="flex-row items-center">
              <View className="w-10" />

              <View className="flex-1">
                <Text
                  selectable
                  className="text-3xl font-instrument-sans tracking-widest text-primary text-center"
                >
                  {hasReferralCode ? referralCode : "--------"}
                </Text>
              </View>

              <Pressable
                onPress={handleCopy}
                disabled={!hasReferralCode}
                hitSlop={10}
                className={`w-10 h-10 items-center justify-center rounded-full ${
                  hasReferralCode ? "opacity-100" : "opacity-50"
                }`}
                accessibilityRole="button"
                accessibilityLabel="Copy referral code"
              >
                <Copy size={18} className="text-secondary" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </GradientBorderMultiple>
    </View>
  );
}
