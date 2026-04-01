import { Modal } from "@/components/ui/modal";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const bgColor = isDark ? "#242220" : "#EAE8E6";

  return (
    <Modal
      ref={ref}
      snapPoints={["45%"]}
      enableContentPanningGesture={false}
      showHandle={true}
      handleBackgroundColor={bgColor}
      backgroundStyle={{ backgroundColor: bgColor }}
    >
      <View style={{ backgroundColor: bgColor, paddingHorizontal: 0 }}>
        <SkinSelectorContainer availablePoints={availablePoints ?? 0} />
      </View>
    </Modal>
  );
});

SkinSelectorModal.displayName = "SkinSelectorModal";
