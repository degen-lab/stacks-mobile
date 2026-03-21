import { useEffect, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { ArrowLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Checkbox, Modal, Text, View, colors } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useSaveTerms } from "@/api/dual-stacking/enrollment/use-save-terms";

const TERMS_TEXT = `Last Updated: October 28, 2025

Welcome to Stacks Labs Incorporated's website (the "Website"). By accessing or using the Website, you agree to these Terms and Conditions (these "Terms"). If you do not agree with these Terms, you must immediately stop using the Website.

1. Introduction

Stacks Labs Incorporated ("Stacks Labs, we," "us," or "our") provides this Website to support the Dual Stacking Program, enabling users to interact with decentralised smart contracts for enrolled sBTC and STX holders and/or participants in third-party platforms on the Stacks blockchain network. Our role is strictly limited to building, maintaining, and providing technical support for this Website and its associated smart contract functionality.

2. Conditions to access and use of website

Use and access to the website is based on you acknowledging, accepting and agreeing to each of the following conditions below (together, the "Conditions"):

• Stacks Labs does not own, control, manage, or profit from the sBTC or STX token(s), their respective ecosystems, or any related project(s).
• Stacks Labs does not sponsor, endorse, or promote the sBTC or STX token(s), any rewards program(s) applicable thereto, or any associated activity(ies).
• References to sBTC, STX or related projects on this Website are for informational purposes only and do not constitute financial, legal, or investment advice.
• The Dual Stacking Program operates independently through decentralised smart contracts. Participation is entirely voluntary and at the sole discretion and risk of users.

Stacks Labs reserves the right in its sole and absolute discretion to terminate or suspend access to the Website for any actual or perceived failure by any user to acknowledge, accept or agree to the Conditions.

3. Limited Role of Stacks Labs

Stacks Labs' involvement is limited to:

• Developing and maintaining the Website and its technical infrastructure.
• Providing access to the smart contracts that enable reward routing functionality.

Stacks Labs does not:

• Operate, manage, or control the Dual Stacking Program.
• Influence, direct, or profit from user participation in the Dual Stacking Program.
• Any interactions between users and the Dual Stacking Program are governed by the smart contracts, and Stacks Labs disclaims all liability for the operation of these contracts or their outcomes.

4. Use of the Website

Subject to your acceptance and agreement to the Conditions and for so long as you are not a Prohibited User and/or none of the Prohibited Actions have occurred or are continuing, you are granted a limited, non-exclusive, non-transferable, and revocable license to access and use the Website solely for lawful purposes.

By using the Website and participating in the Dual Stacking Program, you explicitly acknowledge and agree that:

• Blockchain-based systems involve inherent risks, including but not limited to technical errors, user mistakes, loss of assets, malicious third-party actions, and regulatory uncertainties; and
• You bear sole responsibility for understanding these risks and taking all necessary measures to mitigate them, such as using secure wallets, conducting thorough due diligence on third-party services, and safeguarding your private keys and other access credentials.

By using the Website and participating in the Dual Stacking Program, you assume all risks associated with so-called "decentralised finance" (or "DeFi") activities, including but not limited to:

• Loss of digital assets due to any smart contract vulnerability;
• Regulatory changes affecting the Dual Stacking Program and/or its legality in your jurisdiction; and/or
• Technical failures or misconfigurations in any blockchain system.

5. No Responsibility for Third Party Content

Any services or content accessible through the Website relating to the sBTC and/or STX token(s), their respective ecosystems and/or any associated project(s) is third-party content. Stacks Labs does not own, control, verify, update, or manage such services or content and assumes no responsibility for their quality, accessibility, compatibility, suitability, accuracy or completeness. Users are advised to independently verify all information and consult professional advisers before making decisions.

6. No Guarantees of Rewards

Stacks Labs does not guarantee any specific rewards or return from participation in the Dual Stacking Program. Any publicly-available rewards figures associated therewith are estimates based on potential blockchain performance and may vary significantly. Actual returns are determined by the smart contract functionality and other external factors, which are outside the control of Stacks Labs.

7. No Warranties on the Website

Stacks Labs does not guarantee that the Website or any associated smart contract(s) will be free of errors, interruptions, or vulnerabilities. The Website, the services made available on the Website and its content are provided "as is" and "as available." To the fullest extent permitted by law, Stacks Labs disclaims all express or implied warranties, including but not limited to:

• Fitness for a particular purpose;
• Non-infringement; and
• Accuracy, timeliness, or completeness of the Website's content.

Furthermore, Stacks Labs disclaims, to the maximum extent permitted by law, all responsibility and liability for any and all:

• Losses, errors, or damages arising from your interactions with third-party services, applications, or providers (e.g., the Dual Stacking Program), even if accessed via the Website; and/or
• Delays, breaches, or inaccuracies caused by third-party systems or their operational failures.

8. Prohibited Users

Access to the Website and participation in the Dual Stacking Program is strictly prohibited for users located in restricted or sanctioned jurisdictions, including but not limited to North Korea (DPRK), Iran, Syria, Cuba, and the Crimea, Donetsk, and Luhansk regions of Ukraine; users located in any other jurisdiction subject to comprehensive sanctions or embargoes by the United Nations, the U.S. Office of Foreign Assets Control ("OFAC"), the UK Office of Financial Sanctions Implementation ("OFSI"), the European Union (the "EU"), or similar authorities; individuals or entities appearing on sanctions lists, including but not limited to those maintained by OFAC, OFSI, the EU, or the United Nations Security Council; and/or users engaging in activities in breach of applicable laws or regulations, including but not limited to money laundering, terrorism financing, or fraudulent activities.

9. Prohibited Uses

You agree not to: use the Website for illegal purposes or activities that violate applicable laws or regulations including but not limited to money laundering, fraud, or terrorism financing; access the Website by circumventing geographic, legal, or other restrictions, such as by using VPNs or similar tools; use the services available on the Website for engaging with or transacting with prohibited parties, including those on government sanctions lists; introduce viruses, malware, or other harmful material that could disrupt the Website; attempt to gain unauthorised access to the Website, its systems, or its underlying smart contracts; and/or misrepresent your identity or engage in fraudulent activities while using the Website.

Stacks Labs reserves the right to suspend or terminate your access to the Website if prohibited use is detected or reasonably suspected.

10. Limitation of Liability

To the maximum extent permitted by law, Stacks Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from: your use of or inability to use the Website; errors, inaccuracies, or delays in Website content; and/or any interaction(s) with the Dual Stacking Program or smart contracts.

Furthermore, Stacks Labs is not liable for losses caused by third-party content, systems, or interactions with decentralised smart contracts. Any claims or disputes relating to the Website shall be limited to the direct damages incurred, capped at an aggregate amount of USD $100.

11. Changes to These Terms

Stacks Labs reserves the right to modify or update these Terms at any time without prior notice. Changes will take effect upon posting to the Website. Your continued use of the Website constitutes acceptance of any and all updated Terms.

12. Governing Law and Jurisdiction

These Terms, your access to and use of the Website and/or the services made available on the Website shall be governed by and construed and enforced in accordance with the laws of the State of Delaware, without regard to conflict of law rules or principles of the State of Delaware, or any other jurisdiction that would cause the application of the laws of any other jurisdiction. Any dispute between you and us that is not subject to arbitration or cannot be heard in small claims court, shall be resolved in the state or federal courts sitting in the State of Delaware.

13. Binding Arbitration

This section includes an arbitration agreement and an agreement that all claims will be brought only in an individual capacity (and not as a class action or other representative proceeding). Please read it carefully.

After the informal dispute resolution process, any remaining dispute, controversy or claim relating in any way to these Terms or Stacks Labs' services and/or products will be finally resolved by binding arbitration. This mandatory arbitration agreement applies to you and to Stacks Labs.

You agree that the U.S. Federal Arbitration Act governs the interpretation and enforcement of this provision, and that you and Stacks Labs are each waiving the right to a trial by jury or to participate in a class action.

Any controversy or claim arising out of or relating to this Website shall be settled by arbitration administered by the American Arbitration Association ("AAA") in accordance with its Commercial Arbitration Rules by a sole arbitrator. The place of arbitration shall be New York, New York, and the language of the arbitration shall be English.

CLASS ACTION WAIVER: Any Claim must be brought in the respective claimant's individual capacity, and not as a plaintiff or class member in any purported class, collective, representative, multiple plaintiff or similar proceeding.

14. No Fiduciary Relationship

Stacks Labs does not act as your broker, intermediary, agent, or advisor and owes no fiduciary duties to you. Your use of the Website and associated services is entirely at your own risk and discretion.

15. Indemnification

You agree to indemnify, defend, and hold harmless Stacks Labs, its affiliates, officers, directors, employees, and agents from and against any and all claims, losses, liabilities, damages, expenses (including legal fees), or demands arising from: your use of the Website or any services accessed through it; your breach of these Terms; and your violation of any applicable law or regulation, and/or any right of a third party.

16. No Guarantee of Service Availability

Stacks Labs makes no guarantees or assurances regarding the availability, uptime, or uninterrupted functionality of the Website or any associated services.

17. Privacy and Data Security

Stacks Labs does not collect or store sensitive personal information through the Website. However, certain metadata related to your use of the Website (e.g., IP addresses or transaction data) may be collected for operational purposes.

18. Severability

If any provision of these Terms is found to be invalid, unenforceable, or contrary to applicable law, the remaining provisions shall remain in full force and effect.

19. Force Majeure

Neither Stacks Labs nor its affiliates shall be liable for any failure or delay in the performance of any obligation under these Terms due to causes beyond its reasonable control, including but not limited to acts of God, telecommunications or utility failures, cyberattacks or hacking incidents, earthquakes, storms, or other natural disasters, pandemics or epidemics, blockades, embargoes, or riots, acts or orders of government authorities, and/or acts of terrorism or war.

20. User Acknowledgement

By using the Website, at any such time you use the Website, you confirm and agree that: you possess sufficient knowledge and understanding to interact with blockchain-based systems, digital assets, and related technologies responsibly; you assume full responsibility for understanding and managing the risks outlined in these Terms and for participating in the Dual Stacking Program; you agree use of third-party services accessible through the Website is at your sole risk and subject to the terms and conditions of those third parties; and you have read, understood, and accepted these Terms, including all limitations of liability, disclaimers, and responsibilities.`;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  address: string;
};

export function TermsAndConditionsSheet({
  open,
  onOpenChange,
  onAccept,
  address,
}: Props) {
  const { ref, present, dismiss } = useModal();
  const { colorScheme } = useColorScheme();
  const { mutateAsync: saveTerms, isPending } = useSaveTerms();
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

  const handleAgree = async () => {
    if (!address) return;
    try {
      await saveTerms({ address });
      onOpenChange(false);
      onAccept();
    } catch (err) {
      console.error("Error saving terms acceptance:", err);
    }
  };

  return (
    <Modal
      ref={ref}
      snapPoints={["92%"]}
      title="Terms & Conditions"
      backgroundStyle={{
        backgroundColor:
          colorScheme === "dark" ? colors.charcoal[850] : colors.white,
      }}
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
          {hasScrolledToBottom ? (
            <Checkbox
              checked={agreed}
              onChange={setAgreed}
              accessibilityLabel="I have read and agree to the Terms & Conditions"
              label="I have read and agree to the Terms & Conditions"
            />
          ) : (
            <Text className="font-instrument-sans text-sm text-secondary">
              Scroll to the end to review the full terms before continuing.
            </Text>
          )}
          <View className="flex-row gap-3">
            <Button
              variant="ghost"
              size="lg"
              onPress={() => onOpenChange(false)}
              className="flex-1"
              leftIcon={<ArrowLeft size={16} color="#78716c" />}
              label="Go back"
            />
            <Button
              variant="default"
              size="lg"
              className="flex-1"
              onPress={handleAgree}
              disabled={!agreed || isPending}
              loading={isPending}
              label={isPending ? "Saving..." : "Accept"}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
