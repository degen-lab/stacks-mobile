import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { RefObject } from "react";

import { Modal } from "./modal";
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
    <Modal ref={modalRef} enableDynamicSizing={true} title={title}>
      <BottomSheetScrollView
        contentContainerClassName="px-6 pb-6"
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => (
          <NumberedSection
            key={index}
            index={index + 1}
            title={section.title}
            body={section.body}
          />
        ))}
      </BottomSheetScrollView>
    </Modal>
  );
}
