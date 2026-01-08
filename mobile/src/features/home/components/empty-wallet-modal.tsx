import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as React from "react";
import { Button, Modal, Text, View } from "@/components/ui";

type EmptyWalletModalProps = {
  onBuyCrypto: () => void;
  onDepositCrypto: () => void;
  onDismiss?: () => void;
};

export const EmptyWalletModal = React.forwardRef<
  BottomSheetModal,
  EmptyWalletModalProps
>(({ onBuyCrypto, onDepositCrypto, onDismiss }, ref) => {
  return (
    <Modal
      ref={ref}
      snapPoints={["52%"]}
      showHandle={true}
      onDismiss={onDismiss}
    >
      <View className="flex-1 px-6 pb-8">
        <View className="items-center mb-10 mt-4">
          <View className="h-[72px] w-[190px] rounded-md bg-neutral-200" />
        </View>

        <Text className="text-center text-2xl font-matter text-primary dark:text-white mb-3">
          Nothing to see yet!
        </Text>
        <Text className="text-center text-base font-instrument-sans text-secondary dark:text-neutral-300 mb-8">
          Your wallet is empty. Get some Stacks to watch your portfolio grow.
        </Text>

        <View className="space-y-3">
          <Button
            label="Buy crypto"
            onPress={onBuyCrypto}
            size="lg"
            variant="primaryNavbar"
            className="rounded-full"
          />
          <Button
            label="Deposit crypto"
            onPress={onDepositCrypto}
            size="lg"
            variant="secondaryNavbar"
          />
        </View>
      </View>
    </Modal>
  );
});

EmptyWalletModal.displayName = "EmptyWalletModal";
