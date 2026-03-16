import { useEffect } from "react";
import { ScrollView } from "react-native";
import { useColorScheme } from "nativewind";

import { Button, Modal, Text, View, colors } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { ContractTxDetails } from "@/components/contract-tx-details";
import { FeeOption } from "@/features/stacking/components/fee-selector";
import { TransactionFundingActions } from "@/components/transaction-funding-actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: string;
  contractId: string;
  functionName: string;
  selectedFeeOption: FeeOption;
  onSelectFee: (option: FeeOption) => void;
  customFee: string;
  onCustomFeeChange: (value: string) => void;
  isFeeValid: boolean;
  isLoadingFees: boolean;
  feeMicroStx?: number;
  onConfirm: () => void;
  onSponsoredConfirm?: () => void;
  isSubmitting: boolean;
  isSponsoredSubmitting?: boolean;
};

export function EnrollRewardsSheet({
  open,
  onOpenChange,
  network,
  contractId,
  functionName,
  selectedFeeOption,
  onSelectFee,
  customFee,
  onCustomFeeChange,
  isFeeValid,
  isLoadingFees,
  feeMicroStx,
  onConfirm,
  onSponsoredConfirm,
  isSubmitting,
  isSponsoredSubmitting = false,
}: Props) {
  const { ref, present, dismiss } = useModal();
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    if (open) present();
    else dismiss();
  }, [open, present, dismiss]);

  return (
    <Modal
      ref={ref}
      snapPoints={["55%"]}
      backgroundStyle={{
        backgroundColor:
          colorScheme === "dark" ? colors.charcoal[850] : colors.white,
      }}
      onDismiss={() => onOpenChange(false)}
      enablePanDownToClose
    >
      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <View className="px-6">
          <ContractTxDetails
            title="Enroll for rewards"
            network={network}
            contractAddress={contractId}
            functionName={functionName}
            showFeeSelector
            selectedFeeOption={selectedFeeOption}
            onSelectFee={onSelectFee}
            customFee={customFee}
            onCustomFeeChange={onCustomFeeChange}
            feeMicroStx={feeMicroStx}
            isLoadingFees={isLoadingFees}
            isFeeValid={isFeeValid}
          />

          <Text className="mb-5 font-instrument-sans text-sm leading-relaxed text-secondary">
            This enrolls your wallet for the next Dual Stacking rewards cycle.
            Your sBTC stays in your custody.
          </Text>

          <TransactionFundingActions
            sponsoredLabel="Watch an ad"
            walletLabel="Use wallet funds"
            onPressSponsored={onSponsoredConfirm}
            onPressWallet={onConfirm}
            sponsoredDisabled={
              !isFeeValid || isSubmitting || isSponsoredSubmitting
            }
            walletDisabled={
              !isFeeValid || isSubmitting || isSponsoredSubmitting
            }
            sponsoredLoading={isSponsoredSubmitting}
            walletLoading={isSubmitting}
          />

          <View className="mt-4">
            <Button
              label="Cancel"
              variant="secondary"
              size="lg"
              onPress={() => onOpenChange(false)}
              disabled={isSubmitting || isSponsoredSubmitting}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
