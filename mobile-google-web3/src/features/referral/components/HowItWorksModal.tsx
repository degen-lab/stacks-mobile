import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RefObject } from "react";

import { Modal, ScrollView, Text, View } from "@/components/ui";

type HowItWorksModalProps = {
  modalRef: RefObject<BottomSheetModal>;
};

// TODO: extract this section in a separate component
function Section({
  title,
  body,
  index,
}: {
  title: string;
  body: string;
  index: number;
}) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-2">
        <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-sand-200 border border-surface-secondary">
          <Text className="text-sm font-matter text-primary">{index}</Text>
        </View>
        <Text className="text-lg font-matter text-primary">{title}</Text>
      </View>

      <Text className="text-base font-instrument-sans text-secondary leading-6">
        {body}
      </Text>
    </View>
  );
}

export function HowItWorksModal({ modalRef }: HowItWorksModalProps) {
  return (
    <Modal ref={modalRef} snapPoints={["50%"]} title="How referrals work?">
      <View className="px-6 pb-6">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Section
            index={1}
            title="Share your code"
            body="Using messages, social apps, or email."
          />

          <Section
            index={2}
            title="Your friend signs up"
            body="At sign-up they enter your code. They earn 100 points."
          />

          <Section
            index={3}
            title="You both earn points"
            body="Once they join each time they play you earn bonus points."
          />

          <Section
            index={4}
            title="Track everything"
            body="You can see who joined, who’s active, and how many points each invite earned you."
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
