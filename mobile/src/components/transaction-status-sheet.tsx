import {
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";

import { colors, Modal, Spinner, Text } from "@/components/ui";
import { useModal } from "@/components/ui/modal";

type TransactionStatusCopy = {
  title: string;
  message: string;
};

type TransactionStatusSheetProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
  loading: TransactionStatusCopy;
  success: TransactionStatusCopy;
  children?: ReactNode;
  snapPoints?: string[];
  spinnerColor?: string;
  spinnerTrackColor?: string;
  dismissibleWhenLoading?: boolean;
  enableDynamicSizing?: boolean;
};

export function TransactionStatusSheet({
  open,
  onOpenChange = () => {},
  isLoading = false,
  loading,
  success,
  children,
  snapPoints = ["40%"],
  spinnerColor = colors.stacks.bloodOrange,
  spinnerTrackColor = colors.neutral[200],
  dismissibleWhenLoading = true,
  enableDynamicSizing = false,
}: TransactionStatusSheetProps) {
  const { ref, present, dismiss } = useModal();
  const isDismissible = !isLoading || dismissibleWhenLoading;

  useEffect(() => {
    if (open) {
      present();
      return;
    }

    dismiss();
  }, [dismiss, open, present]);

  const renderStaticBackdrop = useCallback(
    ({ style }: BottomSheetBackdropProps) => (
      <View style={[style, { backgroundColor: "rgba(0, 0, 0, 0.4)" }]} />
    ),
    [],
  );

  return (
    <Modal
      ref={ref}
      snapPoints={enableDynamicSizing ? undefined : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={isDismissible}
      backdropComponent={isDismissible ? undefined : renderStaticBackdrop}
      onDismiss={() => onOpenChange(false)}
    >
      <BottomSheetView className="items-center justify-start gap-8 p-6">
        {isLoading ? (
          <View className="items-center gap-4">
            <Spinner
              color={spinnerColor}
              size={42}
              trackColor={spinnerTrackColor}
            />
            <Text className="text-center font-matter text-[1.5rem] leading-7 tracking-[-0.01em]">
              {loading.title}
            </Text>
            <Text className="text-center font-instrument-sans text-sm font-medium leading-5 text-secondary">
              {loading.message}
            </Text>
          </View>
        ) : (
          <View className="items-center gap-4">
            <Text className="text-center font-matter text-[1.5rem] leading-7 tracking-[-0.01em]">
              {success.title}
            </Text>
            <Text className="text-center font-instrument-sans text-sm font-medium leading-5 text-secondary">
              {success.message}
            </Text>
            {children}
          </View>
        )}
      </BottomSheetView>
    </Modal>
  );
}
