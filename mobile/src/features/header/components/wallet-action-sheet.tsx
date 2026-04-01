import type { LucideIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { ScrollView } from "react-native";

import { Modal, View, colors } from "@/components/ui";
import { BtcRouteLogo } from "@/components/ui/icons/btc-route-logo";
import { StacksRouteLogo } from "@/components/ui/icons/stacks-route-logo";
import { useModal } from "@/components/ui/modal";
import { copyToClipboard } from "@/lib/clipboard";
import {
  BridgeAddressRow,
  BridgeFieldCard,
} from "@/features/sbtc-bridge/components/bridge-field-card";

import { WalletMenuItem } from "./wallet-menu-item";

export type WalletAction = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
};

type WalletActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string | null;
  btcAddress?: string | null;
  actions: WalletAction[];
  snapPoints?: string[];
};

export function WalletActionSheet({
  open,
  onOpenChange,
  address,
  btcAddress,
  actions,
  snapPoints = ["50%"],
}: WalletActionSheetProps) {
  const { ref, present, dismiss } = useModal();
  const { colorScheme } = useColorScheme();
  const modalBackgroundColor =
    colorScheme === "dark" ? colors.charcoal[850] : colors.white;

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
      backgroundStyle={{
        backgroundColor: modalBackgroundColor,
      }}
      handleBackgroundColor={modalBackgroundColor}
      enablePanDownToClose
      onDismiss={() => onOpenChange(false)}
    >
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-6">
        <View className="gap-4">
          <View className="gap-2">
            {btcAddress ? (
              <BridgeFieldCard label="Bitcoin">
                <BridgeAddressRow
                  leftSlot={<BtcRouteLogo size={20} />}
                  address={btcAddress}
                  onCopy={() =>
                    void copyToClipboard(btcAddress, "Address copied")
                  }
                />
              </BridgeFieldCard>
            ) : null}

            {address ? (
              <BridgeFieldCard label="Stacks">
                <BridgeAddressRow
                  leftSlot={<StacksRouteLogo size={20} />}
                  address={address}
                  onCopy={() => void copyToClipboard(address, "Address copied")}
                />
              </BridgeFieldCard>
            ) : null}
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
