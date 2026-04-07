import { View, Modal } from "react-native";

import { colors, Spinner, Text } from "@/components/ui";

interface TransactionLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function TransactionLoadingOverlay({
  visible,
  message = "Broadcasting Transaction",
}: TransactionLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60">
        <View className="mx-8 items-center rounded-2xl bg-surface-tertiary p-8 shadow-lg">
          <View className="items-center gap-4">
            <Spinner
              color={colors.stacks.bloodOrange}
              size={42}
              trackColor={colors.neutral[200]}
            />
            <Text className="text-center font-matter text-[1.5rem] leading-7 tracking-[-0.01em] text-primary">
              {message}
            </Text>
            <Text className="text-center font-instrument-sans text-sm font-medium leading-5 text-secondary">
              Please wait...
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
