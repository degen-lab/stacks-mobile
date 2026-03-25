import {
  Button,
  SelectionCard,
  Text,
  TokenAvatar,
  View,
} from "@/components/ui";
import { Copy, QrCode } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { copyToClipboard } from "@/lib/clipboard";
import type { TransferAsset } from "../types";

const ASSETS = [
  {
    id: "STX" as const,
    name: "Stacks",
    symbol: "STX",
  },
  {
    id: "BTC" as const,
    name: "Bitcoin",
    symbol: "BTC",
  },
];

type ReceiveAssetListProps = {
  stxAddress: string | null;
  btcAddress: string | null;
  onShowQR: (asset: TransferAsset, address: string) => void;
};

export function ReceiveAssetList({
  stxAddress,
  btcAddress,
  onShowQR,
}: ReceiveAssetListProps) {
  const getAddress = (assetId: TransferAsset) => {
    switch (assetId) {
      case "STX":
        return stxAddress;
      case "BTC":
        return btcAddress;
      default:
        return null;
    }
  };

  const handleQR = (asset: TransferAsset, address: string) => {
    Haptics.selectionAsync();
    onShowQR(asset, address);
  };

  return (
    <View className="px-5 pb-6 gap-3">
      {ASSETS.map((asset) => {
        const address = getAddress(asset.id);
        const truncatedAddress = address
          ? `${address.slice(0, 4)}...${address.slice(-4)}`
          : null;

        return (
          <SelectionCard
            key={asset.id}
            icon={<TokenAvatar symbol={asset.symbol} size={32} />}
            title={asset.name}
            subtitle={
              address ? (
                <Text className="text-sm font-mono text-neutral-600 mt-0.5">
                  {truncatedAddress}
                </Text>
              ) : undefined
            }
            rightContent={
              address ? (
                <View className="flex-row items-center gap-1.5">
                  <Button
                    variant="iconSquare"
                    size="iconSquare"
                    leftIcon={<Copy size={18} color="#0B0A0F" />}
                    iconOnly
                    onPress={() =>
                      copyToClipboard(address, "Address copied to clipboard")
                    }
                    accessibilityLabel="Copy address"
                  />

                  <Button
                    variant="iconSquare"
                    size="iconSquare"
                    leftIcon={<QrCode size={18} color="#0B0A0F" />}
                    iconOnly
                    onPress={() => handleQR(asset.id, address)}
                    accessibilityLabel="Show QR code"
                  />
                </View>
              ) : undefined
            }
            bottomContent={
              !address ? (
                <Text className="text-xs font-instrument-sans text-neutral-500">
                  Loading...
                </Text>
              ) : undefined
            }
          />
        );
      })}
    </View>
  );
}
