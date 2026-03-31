import { useState } from "react";
import type { ReactNode, RefObject } from "react";
import { View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";

import { AccordionCard } from "./accordion-card";
import { Modal } from "./modal";
import { Text } from "./text";

export type FaqHelpItem = {
  id: string;
  title: string;
  body: ReactNode;
};

type FaqHelpModalProps = {
  modalRef: RefObject<BottomSheetModal>;
  title: string;
  items: readonly FaqHelpItem[];
  headerIcon?: ReactNode;
};

function FaqHelpHeaderTitle({
  title,
  headerIcon,
}: Pick<FaqHelpModalProps, "title" | "headerIcon">) {
  return (
    <View className="flex-row items-center gap-2.5">
      {headerIcon}
      <Text className="font-matter text-2xl text-primary">{title}</Text>
    </View>
  );
}

export function FaqHelpModal({
  modalRef,
  title,
  items,
  headerIcon,
}: FaqHelpModalProps) {
  const [openItemId, setOpenItemId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  return (
    <Modal
      ref={modalRef}
      enableDynamicSizing={true}
      headerTitle={<FaqHelpHeaderTitle title={title} headerIcon={headerIcon} />}
      handleBackgroundColor="#EAE8E6"
      backgroundStyle={{ backgroundColor: "#EAE8E6" }}
      enablePanDownToClose
    >
      <BottomSheetScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-3 bg-surface-primary px-4">
          {items.map((item) => (
            <AccordionCard
              key={item.id}
              title={item.title}
              body={item.body}
              isOpen={openItemId === item.id}
              onToggle={() =>
                setOpenItemId((current) =>
                  current === item.id ? null : item.id,
                )
              }
              testID={item.id}
            />
          ))}
        </View>
      </BottomSheetScrollView>
    </Modal>
  );
}
