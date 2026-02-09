import { HelpCircle } from "lucide-react-native";

import { colors, ScreenHeader, useModal } from "@/components/ui";

export function DualStackingHeader() {
  const { present: presentHelpModal } = useModal();
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
