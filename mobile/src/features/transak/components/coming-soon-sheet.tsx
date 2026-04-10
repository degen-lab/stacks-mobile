import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useEffect } from "react";

import { Button, Modal, Text } from "@/components/ui";
import { useModal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ComingSoonSheet({ open, onClose }: Props) {
  const { ref, present, dismiss } = useModal();

  useEffect(() => {
    if (open) present();
    else dismiss();
  }, [open, present, dismiss]);

  return (
    <Modal
      ref={ref}
      enableDynamicSizing
      title="Coming Soon"
      onDismiss={onClose}
      enablePanDownToClose
    >
      <BottomSheetScrollView contentContainerClassName="px-5 pb-6 gap-6">
        <Text className="text-center font-instrument-sans text-base leading-6 text-secondary">
          This feature is not available yet.{"\n"}Check back soon!
        </Text>
        <Button
          label="Got it"
          onPress={() => {
            dismiss();
            onClose();
          }}
          size="lg"
          variant="outline"
        />
      </BottomSheetScrollView>
    </Modal>
  );
}
