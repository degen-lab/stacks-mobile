import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { HelpCircle } from "lucide-react-native";
import { RefObject } from "react";

import { colors, ScreenHeader, useModal } from "@/components/ui";

export function DualStackingHeader() {
  const { ref: helpModalRef, present: presentHelpModal } = useModal();
  return (
    <>
      <ScreenHeader
        title="Dual Stacking"
        rightAction={{
          icon: <HelpCircle size={20} color={colors.neutral[900]} />,
          onPress: presentHelpModal,
          accessibilityLabel: "How dual stacking works",
        }}
      />

      {/* TODO: Add DualStackingGuideModal when ready */}
      {/* <DualStackingGuideModal
        modalRef={helpModalRef as RefObject<BottomSheetModal>}
      /> */}
    </>
  );
}
