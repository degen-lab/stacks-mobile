import { useEffect } from "react";
import { ArrowDownLeft, CreditCard } from "lucide-react-native";

import { Modal, SelectionCard, View, colors } from "@/components/ui";
import { useModal } from "@/components/ui/modal";

export type GetAssetSheetAsset = "STX" | "BTC";

type GetAssetSheetProps = {
  open: boolean;
  asset: GetAssetSheetAsset | null;
  onClose: () => void;
  onBuy: (asset: GetAssetSheetAsset) => void;
  onReceive: (asset: GetAssetSheetAsset) => void;
};

const COPY: Record<
  GetAssetSheetAsset,
  {
    title: string;
    buySubtitle: string;
    receiveSubtitle: string;
  }
> = {
  STX: {
    title: "Get STX",
    buySubtitle: "Buy STX with card or bank transfer.",
    receiveSubtitle: "Receive STX to your wallet address.",
  },
  BTC: {
    title: "Get BTC",
    buySubtitle: "Buy BTC with card or bank transfer.",
    receiveSubtitle: "Receive BTC to your wallet address.",
  },
};

export function GetAssetSheet({
  open,
  asset,
  onClose,
  onBuy,
  onReceive,
}: GetAssetSheetProps) {
  const { ref, present, dismiss } = useModal();

  useEffect(() => {
    if (!asset) return;

    if (open) {
      present();
      return;
    }

    dismiss();
  }, [asset, dismiss, open, present]);

  if (!asset) return null;

  const selectedAsset = asset;
  const copy = COPY[selectedAsset];

  function handleAction(action: "buy" | "receive") {
    dismiss();
    requestAnimationFrame(() => {
      if (action === "buy") {
        onBuy(selectedAsset);
        return;
      }

      onReceive(selectedAsset);
    });
  }

  return (
    <Modal
      ref={ref}
      snapPoints={["44%"]}
      title={copy.title}
      onDismiss={onClose}
      enablePanDownToClose
    >
      <View className="gap-3 px-5 pb-6">
        <SelectionCard
          icon={<CreditCard size={18} color={colors.neutral[800]} />}
          iconCircular
          title={`Buy ${asset}`}
          subtitle={copy.buySubtitle}
          onPress={() => handleAction("buy")}
        />

        <SelectionCard
          icon={<ArrowDownLeft size={18} color={colors.neutral[800]} />}
          iconCircular
          title={`Receive ${asset}`}
          subtitle={copy.receiveSubtitle}
          onPress={() => handleAction("receive")}
        />
      </View>
    </Modal>
  );
}
