import { useEffect, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { Modal, Text, View } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const TERMS_TEXT = `Last Updated: March 2026

Welcome to Stacks Labs Incorporated's sBTC Bridge (the "Bridge"). By using the Bridge, you agree to these Terms and Conditions (these "Terms"). If you do not agree with these Terms, you must immediately stop using the Bridge.

1. Introduction

Stacks Labs Incorporated ("Stacks Labs," "we," "us," or "our") provides the Bridge to enable users to convert BTC to sBTC and sBTC back to BTC through interaction with the sBTC protocol on the Stacks blockchain. Our role is strictly limited to building, maintaining, and providing technical support for the Bridge and its associated smart contract functionality.

2. Conditions to Access and Use

Use and access to the Bridge is based on you acknowledging, accepting and agreeing to each of the following conditions (together, the "Conditions"):

• Stacks Labs does not own, control, manage, or profit from the BTC or sBTC token(s), their respective ecosystems, or any related project(s).
• Stacks Labs does not sponsor, endorse, or promote the BTC or sBTC token(s) or any associated activity(ies).
• References to BTC, sBTC, or related projects through the Bridge are for informational purposes only and do not constitute financial, legal, or investment advice.
• The sBTC protocol operates independently through decentralised smart contracts. Participation is entirely voluntary and at the sole discretion and risk of users.

Stacks Labs reserves the right in its sole and absolute discretion to terminate or suspend access to the Bridge for any actual or perceived failure by any user to acknowledge, accept or agree to the Conditions.

3. Limited Role of Stacks Labs

Stacks Labs' involvement is limited to:

• Developing and maintaining the Bridge interface and its technical infrastructure.
• Providing access to the smart contracts that enable BTC ↔ sBTC conversion.

Stacks Labs does not:

• Operate, manage, or control the sBTC protocol or its signers.
• Influence, direct, or profit from user participation in the sBTC protocol.
• Any interactions between users and the sBTC protocol are governed by the smart contracts, and Stacks Labs disclaims all liability for the operation of these contracts or their outcomes.

4. Use of the Bridge

Subject to your acceptance of the Conditions, you are granted a limited, non-exclusive, non-transferable, and revocable license to access and use the Bridge solely for lawful purposes.

By using the Bridge, you explicitly acknowledge and agree that:

• Blockchain-based systems involve inherent risks, including but not limited to technical errors, user mistakes, loss of assets, malicious third-party actions, and regulatory uncertainties.
• Bitcoin deposits require 6 block confirmations (~60 minutes) before sBTC is minted. This process cannot be reversed once initiated.
• You bear sole responsibility for understanding these risks and for safeguarding your private keys and other access credentials.

By using the Bridge, you assume all risks associated with decentralised finance (DeFi) activities, including but not limited to:

• Loss of digital assets due to smart contract vulnerabilities.
• Regulatory changes affecting the sBTC protocol and/or its legality in your jurisdiction.
• Technical failures, delays, or misconfigurations in any blockchain system.
• Deposit reclaim periods and associated timing risks.

5. No Responsibility for Third Party Content

Any services or content accessible through the Bridge relating to the BTC and/or sBTC token(s) is third-party content. Stacks Labs does not own, control, verify, or manage such services and assumes no responsibility for their quality, accessibility, or accuracy.

6. No Guarantees

Stacks Labs does not guarantee that the Bridge or any associated smart contract(s) will be free of errors, interruptions, or vulnerabilities. The Bridge and its services are provided "as is" and "as available." To the fullest extent permitted by law, Stacks Labs disclaims all express or implied warranties.

7. Prohibited Users

Access to the Bridge is strictly prohibited for users located in restricted or sanctioned jurisdictions, including but not limited to North Korea (DPRK), Iran, Syria, Cuba, and the Crimea, Donetsk, and Luhansk regions of Ukraine; users on sanctions lists maintained by OFAC, OFSI, the EU, or the United Nations Security Council; and users engaging in money laundering, terrorism financing, or fraudulent activities.

8. Prohibited Uses

You may not use the Bridge to: violate any applicable laws or regulations; circumvent sanctions or export controls; engage in market manipulation; or facilitate any illegal activity.

9. Limitation of Liability

To the maximum extent permitted by law, Stacks Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Bridge, including loss of digital assets, loss of profits, or data loss.

10. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Stacks Labs is incorporated, without regard to conflict of law principles.

11. Changes to Terms

Stacks Labs reserves the right to modify these Terms at any time. Continued use of the Bridge following any changes constitutes your acceptance of the revised Terms.

12. User Acknowledgement

By using the Bridge, you confirm that: you possess sufficient knowledge to interact with blockchain-based systems responsibly; you assume full responsibility for the risks outlined in these Terms; and you have read, understood, and accepted these Terms in their entirety.`;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
};

export function BridgeTermsSheet({ open, onOpenChange, onAccept }: Props) {
  const { ref, present, dismiss } = useModal();
  const [agreed, setAgreed] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    if (open) {
      setAgreed(false);
      setHasScrolledToBottom(false);
      present();
    } else {
      dismiss();
    }
  }, [open, present, dismiss]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (hasScrolledToBottom) return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    if (distanceFromBottom <= 40) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    onOpenChange(false);
    onAccept();
  };

  return (
    <Modal
      ref={ref}
      snapPoints={["92%"]}
      title="Terms & Conditions"
      backgroundStyle={{ backgroundColor: "#EAE8E6" }}
      onDismiss={() => onOpenChange(false)}
      enablePanDownToClose
    >
      <View className="flex-1">
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          showsVerticalScrollIndicator
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text className="font-instrument-sans text-sm text-secondary leading-6">
            {TERMS_TEXT}
          </Text>
        </BottomSheetScrollView>

        <View className="px-5 pt-4 pb-8 gap-4 border-t border-sand-200">
          <Checkbox
            checked={agreed}
            onChange={hasScrolledToBottom ? setAgreed : () => {}}
            disabled={!hasScrolledToBottom}
            accessibilityLabel="I have read and agree to the Terms & Conditions"
            label="I have read and agree to the Terms & Conditions"
          />
          <View className="flex-row gap-3">
            <Button
              variant="ghost"
              size="lg"
              onPress={() => onOpenChange(false)}
              label="Go back"
            />
            <Button
              variant="default"
              size="lg"
              onPress={handleAccept}
              disabled={!agreed}
              className="flex-1"
              label="Accept"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
