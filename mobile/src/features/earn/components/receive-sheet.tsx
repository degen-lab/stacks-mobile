import { useEffect } from "react";

import { Modal, Text, View } from "@/components/ui";
import { useModal } from "@/components/ui/modal";

type ReceiveSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function ReceiveSheet({ open, onClose }: ReceiveSheetProps) {
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
      snapPoints={["32%"]}
      title="Receive"
      onDismiss={onClose}
      enablePanDownToClose
    >
      <View className="px-5 pb-6 gap-3">
        <Text className="text-lg font-matter text-primary">Coming soon</Text>
        <Text className="text-sm font-instrument-sans text-secondary leading-5">
          Receiving BTC, sBTC, and STX will be available shortly. Check back
          soon.
        </Text>
      </View>
    </Modal>
  );
}
