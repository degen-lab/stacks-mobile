import { Copy } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { Pressable, StyleProp, View, ViewStyle } from "react-native";

import { Text } from "../text";
import { GradientBorderMultiple } from "@/components/ui/gradient-border-multiple";
import { copyToClipboard } from "@/lib/clipboard";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";

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
  innerBackground,
  containerStyle,
  onCopied,
}: ReferralCodeCardProps) {
  const { colorScheme } = useColorScheme();
  const handleCopy = async () => {
    if (!hasReferralCode) return;
    await copyToClipboard(referralCode, "Code copied!");
    onCopied?.();
  };
  const resolvedInnerBackground =
    innerBackground ??
    (colorScheme === "dark"
      ? resolveThemeTokenColor("dark", "--color-surface-primary")
      : "#F8F4EF");
  const copyIconColor =
    colorScheme === "dark"
      ? resolveThemeTokenColor("dark", "--color-text-secondary")
      : resolveThemeTokenColor("light", "--color-text-secondary");

  return (
    <View style={containerStyle}>
      {/* label OUTSIDE */}
      <View className="mb-2 flex-row items-end justify-between px-2">
        <Text className="text-primary font-matter text-xl">Referral code</Text>
      </View>

      <GradientBorderMultiple
        layers={BLOOD_ORANGE_LAYERS}
        borderRadius={borderRadius}
        innerBackground={resolvedInnerBackground}
        contentStyle={{ padding: 0 }}
      >
        <Pressable
          onPress={handleCopy}
          disabled={!hasReferralCode}
          className={`rounded-2xl bg-sand-100 p-4 active:opacity-90 dark:bg-surface-primary ${
            hasReferralCode ? "" : "opacity-70"
          }`}
        >
          <View className="rounded-xl bg-sand-200 px-3 py-3 dark:bg-surface-secondary">
            <View className="flex-row items-center">
              <View className="w-10" pointerEvents="none" />

              <View className="flex-1" pointerEvents="none">
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
                <Copy size={18} color={copyIconColor} pointerEvents="none" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </GradientBorderMultiple>
    </View>
  );
}
