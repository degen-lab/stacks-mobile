import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import React from "react";

import { Button, Modal, Text, View } from "@/components/ui";

type Props = {
  modalRef: React.RefObject<BottomSheetModal | null>;
  onAllow: () => void;
  onDecline: () => void;
};

export function AnalyticsConsentModal({ modalRef, onAllow, onDecline }: Props) {
  return (
    <Modal
      ref={modalRef}
      enableDynamicSizing={true}
      enablePanDownToClose={false}
    >
      <BottomSheetView>
        <View className="px-6 pb-8 pt-4">
          <View className="items-center">
            <View className="rounded-full bg-sand-100 dark:bg-surface-secondary px-3 py-1">
              <Text className="font-instrument-sans-medium text-xs uppercase tracking-[1px] text-primary">
                Optional
              </Text>
            </View>
          </View>

          <Text className="mt-6 text-center text-3xl font-matter text-primary">
            Help improve Enter Stacks
          </Text>

          <Text className="mt-3 text-center text-base font-instrument-sans leading-7 text-secondary">
            Allow analytics so we can fix bugs faster and improve the app. You
            can change this anytime in Settings.
          </Text>

          <View className="mt-8 gap-3">
            <Button
              variant="primaryNavbar"
              className="rounded-full"
              size="lg"
              label="Allow analytics"
              onPress={onAllow}
            />
            <Button
              variant="ghost"
              size="lg"
              label="Not now"
              onPress={onDecline}
              textClassName="font-instrument-sans-medium text-secondary"
            />
          </View>
        </View>
      </BottomSheetView>
    </Modal>
  );
}
