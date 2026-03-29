import { View, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button } from "@/components/ui";
import { GradientBorderMultiple } from "@/components/ui/gradient-border-multiple";
import colors from "@/components/ui/colors";
import { Copy } from "lucide-react-native";
import { copyToClipboard } from "@/lib/clipboard";
import type { AppToken } from "@/lib/assets/tokens";

type QRCodeViewProps = {
  asset: AppToken;
  address: string;
  onClose: () => void;
};

export function QRCodeView({ asset, address, onClose }: QRCodeViewProps) {
  const getGradientLayers = () => {
    switch (asset) {
      case "STX":
        return [
          {
            thickness: 6,
            angle: 90,
            colors: ["rgba(255,153,92,0.25)", "rgba(255,153,92,0.05)"] as const,
          },
          {
            thickness: 6,
            angle: 90,
            colors: [
              "rgba(255,186,140,0.60)",
              "rgba(255,220,195,0.20)",
            ] as const,
          },
        ];
      case "BTC":
        return [
          {
            thickness: 6,
            angle: 90,
            colors: ["rgba(255,152,53,0.25)", "rgba(255,152,53,0.05)"] as const,
          },
          {
            thickness: 6,
            angle: 90,
            colors: [
              "rgba(255,152,53,0.60)",
              "rgba(255,186,140,0.20)",
            ] as const,
          },
        ];
      default:
        return [
          {
            thickness: 6,
            angle: 90,
            colors: ["rgba(255,153,92,0.25)", "rgba(255,153,92,0.05)"] as const,
          },
          {
            thickness: 6,
            angle: 90,
            colors: [
              "rgba(255,186,140,0.60)",
              "rgba(255,220,195,0.20)",
            ] as const,
          },
        ];
    }
  };

  const addressChunks = address.match(/.{1,4}/g) || [];

  return (
    <View className="flex-1 px-5 pb-6 items-center justify-center">
      <GradientBorderMultiple
        layers={getGradientLayers()}
        borderRadius={32}
        innerBackground={colors.white}
      >
        <View className="w-64 h-64 items-center justify-center p-6">
          <QRCode value={address} size={164} backgroundColor="white" />
        </View>
      </GradientBorderMultiple>

      <View className="mt-8 mb-8">
        <View className="flex-row flex-wrap justify-center gap-x-3 gap-y-2 max-w-xs">
          {addressChunks.map((chunk, index) => (
            <Text
              key={index}
              className={`text-base font-mono tracking-wider ${
                index % 2 === 0 ? "text-primary" : "text-neutral-500"
              }`}
            >
              {chunk}
            </Text>
          ))}
        </View>
      </View>
      <Button
        variant="iconSquare"
        label="Copy address"
        leftIcon={<Copy size={16} color="#0B0A0F" />}
        onPress={() => copyToClipboard(address, "Address copied to clipboard")}
        accessibilityLabel="Copy address"
      />
    </View>
  );
}
