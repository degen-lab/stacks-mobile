import { useEffect } from "react";
import { useRouter } from "expo-router";

import { Image, Modal, Text, View } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MintSbtcSheet({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { ref, present, dismiss } = useModal();

  useEffect(() => {
    if (open) present();
    else dismiss();
  }, [open, present, dismiss]);

  return (
    <Modal
      ref={ref}
      snapPoints={["55%"]}
      title="Mint sBTC"
      onDismiss={() => onOpenChange(false)}
      enablePanDownToClose
    >
      <View className="px-5 pb-6 gap-4">
        <Image
          source={require("@/assets/images/modals/mint-sbtc.svg")}
          style={{ width: 191, height: 97 }}
          contentFit="contain"
          className="mx-auto"
        />
        <Text className="font-instrument-sans text-sm text-secondary leading-5">
          You&apos;re being directed to the sBTC Bridge, where you can peg in
          BTC. Your sBTC stays in your wallet and in your control, and you can
          peg back out to the L1 at any time.
        </Text>
        <Button
          label="Go to Bridge"
          variant="default"
          size="lg"
          className="mt-3"
          onPress={() => {
            onOpenChange(false);
            router.push("/Earn/sbtc-bridge");
          }}
        />
      </View>
    </Modal>
  );
}
