import type { LucideIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { ScrollView } from "react-native";

import { Modal, Text, View, colors } from "@/components/ui";
import { useModal } from "@/components/ui/modal";

import WalletMenuItem from "../../wallet/wallet-menu-item";

type WalletAction = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
};

type WalletActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string | null;
  actions: WalletAction[];
};

export function WalletActionSheet({
  open,
  onOpenChange,
  address,
  actions,
}: WalletActionSheetProps) {
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
      snapPoints={["50%"]}
      backgroundStyle={{
        backgroundColor:
          colorScheme === "dark" ? colors.charcoal[850] : colors.white,
      }}
      enablePanDownToClose
      onDismiss={() => onOpenChange(false)}
    >
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-6">
        <View className="gap-4">
          <View className="rounded-2xl border border-surface-secondary bg-neutral-100 p-4">
            <Text className="font-instrument-sans text-xs uppercase tracking-wide text-secondary">
              Connected wallet
            </Text>
            <Text className="mt-2 font-mono text-sm leading-6 text-primary">
              {address ?? "Wallet unavailable"}
            </Text>
          </View>

          <View className="gap-2">
            {actions.map((action) => (
              <WalletMenuItem
                key={action.label}
                label={action.label}
                icon={action.icon}
                onPress={action.onPress}
                destructive={action.destructive}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
