import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { HelpCircle } from "lucide-react-native";
import { RefObject } from "react";

import { colors, ScreenHeader, useModal } from "@/components/ui";
import { StackingGuideModal } from "./stacking-guide-modal";

export function StackingHeader() {
  const { ref: helpModalRef, present: presentHelpModal } = useModal();
  return (
    <>
      <ScreenHeader
        title="Stack STX"
        rightAction={{
          icon: <HelpCircle size={20} color={colors.neutral[900]} />,
          onPress: presentHelpModal,
          accessibilityLabel: "How stacking works",
        }}
      />

      <StackingGuideModal
        modalRef={helpModalRef as RefObject<BottomSheetModal>}
      />
    </>
  );
}
