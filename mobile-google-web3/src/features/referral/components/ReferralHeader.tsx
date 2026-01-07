import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { HelpCircle } from "lucide-react-native";
import { RefObject } from "react";

import { colors, ScreenHeader, useModal } from "@/components/ui";
import { HowItWorksModal } from "@/features/referral/components/HowItWorksModal";

type ReferralHeaderProps = {
  onPressHelp?: () => void;
};

export function ReferralHeader({ onPressHelp }: ReferralHeaderProps) {
  const { ref: helpModalRef, present: presentHelpModal } = useModal();

  const handleHelpPress = () => {
    if (onPressHelp) {
      onPressHelp();
    } else {
      presentHelpModal();
    }
  };

  return (
    <>
      <ScreenHeader
        title="Referral"
        rightAction={{
          icon: <HelpCircle size={20} color={colors.neutral[900]} />,
          onPress: handleHelpPress,
          accessibilityLabel: "How referrals work",
        }}
      />

      {!onPressHelp && (
        <HowItWorksModal
          modalRef={helpModalRef as RefObject<BottomSheetModal>}
        />
      )}
    </>
  );
}
