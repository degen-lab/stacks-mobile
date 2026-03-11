import { useEffect } from "react";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";

import { Image, Modal, Text, View } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StackingPoolSheet({ open, onOpenChange }: Props) {
  const { ref, present, dismiss } = useModal();

  useEffect(() => {
    if (open) present();
    else dismiss();
  }, [open, present, dismiss]);

  return (
    <Modal
      ref={ref}
      snapPoints={["65%"]}
      title="Join a pool to start Stacking."
      onDismiss={() => onOpenChange(false)}
      enablePanDownToClose
    >
      <View className="px-5 pb-6 gap-4">
        <Image
          source={require("@/assets/images/modals/stacking-pool.svg")}
          style={{ width: 138, height: 110 }}
          contentFit="contain"
          className="mx-auto"
        />
        <Text className="font-matter text-base text-primary leading-6">
          Earn ~9% APY in standard Stacking rewards on top of boosted rewards
          through Dual Stacking.
        </Text>
        <Text className="font-instrument-sans text-sm text-secondary leading-5">
          You&apos;ll be redirected to Leather Earn to view active Stacking
          pools.
        </Text>
        <Button
          label="Stack with Leather ↗"
          variant="default"
          size="lg"
          className="mt-1"
          onPress={() => {
            onOpenChange(false);
            void openBrowserAsync("https://app.leather.io/stacking", {
              presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
            });
          }}
        />
        <Button
          label="Liquid Stack with StackingDAO ↗"
          variant="gameOutline"
          size="lg"
          onPress={() => {
            onOpenChange(false);
            void openBrowserAsync("https://app.stackingdao.com/", {
              presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
            });
          }}
        />
      </View>
    </Modal>
  );
}
