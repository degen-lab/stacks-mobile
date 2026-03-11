import { useColorScheme } from "nativewind";
import { useEffect } from "react";
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
}: TransactionStatusSheetProps) {
  const { ref, present, dismiss } = useModal();
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (open) {
      present();
      return;
    }

    dismiss();
  }, [dismiss, open, present]);

  return (
    <Modal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor:
          colorScheme === "dark" ? colors.charcoal[850] : colors.white,
      }}
      onDismiss={() => onOpenChange(false)}
    >
      <View className="flex-1 items-center justify-start gap-8 p-6">
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
      </View>
    </Modal>
  );
}
