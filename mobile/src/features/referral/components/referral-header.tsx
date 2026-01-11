import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { HelpCircle } from "lucide-react-native";
import { RefObject } from "react";

import {
  colors,
  HowItWorksModal,
  ScreenHeader,
  useModal,
} from "@/components/ui";

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
          title="How referrals work?"
          sections={[
            {
              title: "Share your code",
              body: "Using messages, social apps, or email.",
            },
            {
              title: "Your friend signs up",
              body: "At sign-up they enter your code. They earn 100 points.",
            },
            {
              title: "You both earn points",
              body: "Once they join each time they play you earn bonus points.",
            },
            {
              title: "Track everything",
              body: "You can see who joined, who's active, and how many points each invite earned you.",
            },
          ]}
        />
      )}
    </>
  );
}
