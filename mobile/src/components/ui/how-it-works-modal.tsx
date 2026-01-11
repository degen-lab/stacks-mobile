import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RefObject } from "react";

import { Modal, ScrollView, View } from "@/components/ui";
import { NumberedSection } from "./numbered-section";

type HowItWorksModalProps = {
  modalRef: RefObject<BottomSheetModal>;
  title?: string;
  sections: {
    title: string;
    body: string;
  }[];
};

export function HowItWorksModal({
  modalRef,
  title = "How it works?",
  sections,
}: HowItWorksModalProps) {
  return (
    <Modal ref={modalRef} snapPoints={["50%"]} title={title}>
      <View className="px-6 pb-6">
        <ScrollView showsVerticalScrollIndicator={false}>
          {sections.map((section, index) => (
            <NumberedSection
              key={index}
              index={index + 1}
              title={section.title}
              body={section.body}
            />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}
