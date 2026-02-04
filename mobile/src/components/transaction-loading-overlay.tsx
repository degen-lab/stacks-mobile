import { View, ActivityIndicator, Modal } from "react-native";
import { Text, colors } from "@/components/ui";
import { useColorScheme } from "nativewind";

interface TransactionLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function TransactionLoadingOverlay({
  visible,
  message = "Broadcasting Transaction",
}: TransactionLoadingOverlayProps) {
  const { colorScheme } = useColorScheme();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60">
        <View className="mx-8 items-center rounded-2xl bg-surface-tertiary p-8 shadow-lg">
          <ActivityIndicator
            size="large"
            color={
              colorScheme === "dark" ? colors.neutral[400] : colors.neutral[600]
            }
          />
          <Text className="mt-4 text-center font-instrument-sans-medium text-base text-primary">
            {message}
          </Text>
          <Text className="mt-2 text-center font-instrument-sans text-sm text-secondary">
            Please wait...
          </Text>
        </View>
      </View>
    </Modal>
  );
}
