import { Button, Modal, Text, View, colors } from "@/components/ui";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import React from "react";

type ContractCallDetailsSheetProps = {
  title?: string;
  network?: string;
  contractName?: string;
  functionName?: string;
  argsSummary?: string;
  feeLabel?: string;
  txHex?: string;
  onClose?: () => void;
  snapPoints?: string[];
};

export const ContractCallDetailsSheet = React.forwardRef<
  BottomSheetModal,
  ContractCallDetailsSheetProps
>(
  (
    {
      title = "Contract Call Details",
      network,
      contractName,
      functionName,
      argsSummary,
      feeLabel,
      txHex,
      onClose,
      snapPoints = ["55%"],
    },
    ref,
  ) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    return (
      <Modal
        ref={ref}
        title={title}
        snapPoints={snapPoints}
        backgroundStyle={{
          backgroundColor: isDark ? colors.charcoal[850] : colors.white,
        }}
        onDismiss={onClose}
      >
        <View className="px-6 pb-6">
          <View className="rounded-xl border border-sand-200 bg-sand-100 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            {network ? <InfoRow label="Network" value={network} /> : null}
            {contractName ? (
              <InfoRow label="Contract" value={contractName} />
            ) : null}
            {functionName ? (
              <InfoRow label="Function" value={functionName} />
            ) : null}
            {argsSummary ? (
              <InfoRow label="Arguments" value={argsSummary} />
            ) : null}
            {feeLabel ? <InfoRow label="Fee" value={feeLabel} /> : null}
            {txHex ? <InfoRow label="Tx Hex" value={txHex} /> : null}
          </View>

          <Button
            label="Close"
            variant="secondary"
            size="game"
            onPress={onClose}
            className="mt-6"
          />
          {/* TODO: Add copy-to-clipboard and external explorer links. */}
        </View>
      </Modal>
    );
  },
);

ContractCallDetailsSheet.displayName = "ContractCallDetailsSheet";

type InfoRowProps = {
  label: string;
  value: string;
};

const InfoRow = ({ label, value }: InfoRowProps) => {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-xs font-instrument-sans text-secondary dark:text-neutral-300">
        {label}
      </Text>
      <Text className="text-sm font-instrument-sans text-primary dark:text-white">
        {value}
      </Text>
    </View>
  );
};
