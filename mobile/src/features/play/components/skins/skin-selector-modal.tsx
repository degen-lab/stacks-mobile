import { Modal } from "@/components/ui/modal";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { View } from "react-native";
import SkinSelectorContainer from "./skin-selector";

type SkinSelectorModalProps = {
  availablePoints?: number;
};

export const SkinSelectorModal = React.forwardRef<
  BottomSheetModal,
  SkinSelectorModalProps
>(({ availablePoints }, ref) => {
  return (
    <Modal
      ref={ref}
      snapPoints={["45%"]}
      enableContentPanningGesture={false}
      showHandle={true}
      handleBackgroundColor="#EAE8E6"
      backgroundStyle={{ backgroundColor: "#EAE8E6" }}
    >
      <View style={{ backgroundColor: "#EAE8E6", paddingHorizontal: 0 }}>
        <SkinSelectorContainer availablePoints={availablePoints ?? 0} />
      </View>
    </Modal>
  );
});

SkinSelectorModal.displayName = "SkinSelectorModal";
