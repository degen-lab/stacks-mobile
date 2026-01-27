import { useEffect } from "react";

import { Modal, Text, View } from "@/components/ui";
import { useModal } from "@/components/ui/modal";

type BridgeSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function BridgeSheet({ open, onClose }: BridgeSheetProps) {
  const { ref, present, dismiss } = useModal();

  useEffect(() => {
    if (open) {
      present();
    } else {
      dismiss();
    }
  }, [open, present, dismiss]);

  return (
    <Modal
      ref={ref}
      snapPoints={["40%"]}
      title="Bridge assets"
      onDismiss={onClose}
      enablePanDownToClose
    >
      <View className="px-5 pb-6 gap-3">
        <Text className="text-lg font-matter text-primary">Coming soon</Text>
        <Text className="text-sm font-instrument-sans text-secondary leading-5">
          Bridging between BTC, sBTC, and STX is on the way. Stay tuned.
        </Text>
      </View>
    </Modal>
  );
}
