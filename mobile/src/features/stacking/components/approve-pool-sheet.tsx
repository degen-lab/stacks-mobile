import React from "react";
import { View, ScrollView } from "react-native";
import { Button, Text, Modal, colors } from "@/components/ui";
import { FeeOption } from "./fee-selector";
import { ContractTxDetails } from "@/components/contract-tx-details";
import { useColorScheme } from "nativewind";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { TransactionFundingActions } from "@/components/transaction-funding-actions";

interface ApprovePoolSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
  network: string;
  poolAddress: string;
  feeLabel: string;
  selectedFeeOption: FeeOption;
  onSelectFee: (option: FeeOption) => void;
  customFee: string;
  onCustomFeeChange: (value: string) => void;
  isFeeValid: boolean;
  isLoadingFees: boolean;
  feeMicroStx?: number;
  stackingPrice?: number;
  onConfirm: () => void;
  onSponsoredConfirm?: () => void;
  isLoading: boolean;
  isSponsoredLoading?: boolean;
  confirmDisabled?: boolean;
}

export function ApprovePoolSheet({
  sheetRef,
  onClose,
  network,
  poolAddress,
  feeLabel,
  selectedFeeOption,
  onSelectFee,
  customFee,
  onCustomFeeChange,
  isFeeValid,
  isLoadingFees,
  feeMicroStx,
  stackingPrice = 0,
  onConfirm,
  onSponsoredConfirm,
  isLoading,
  isSponsoredLoading = false,
  confirmDisabled,
}: ApprovePoolSheetProps) {
  const { colorScheme } = useColorScheme();

  return (
    <Modal
      ref={sheetRef}
      snapPoints={["45%"]}
      backgroundStyle={{
        backgroundColor:
          colorScheme === "dark" ? colors.charcoal[850] : colors.white,
      }}
      onDismiss={onClose}
    >
      <ScrollView className="flex-1" contentContainerClassName="pb-6">
        <View className="px-6">
          <ContractTxDetails
            network={network}
            title="Approve Pool"
            contractAddress={poolAddress}
            functionName="allow-contract-caller"
            contractArgs={[
              {
                name: "caller",
                value: poolAddress,
                type: "principal",
              },
              {
                name: "until-burn-ht",
                value: "none",
                type: "optional uint",
              },
            ]}
            showFeeSelector={true}
            selectedFeeOption={selectedFeeOption}
            onSelectFee={onSelectFee}
            customFee={customFee}
            onCustomFeeChange={onCustomFeeChange}
            feeMicroStx={feeMicroStx}
            stackingPrice={stackingPrice}
            isLoadingFees={isLoadingFees}
            isFeeValid={isFeeValid}
          />

          <Text className="mb-4 font-instrument-sans text-sm leading-relaxed text-secondary">
            To stake with Fast Pool, approve it to lock your STX. This is an{" "}
            <Text className="font-instrument-sans-medium text-primary">
              one-time action
            </Text>
            .
          </Text>

          {/* Actions */}
          <TransactionFundingActions
            sponsoredLabel="Watch an ad"
            walletLabel="Use wallet funds"
            onPressSponsored={onSponsoredConfirm}
            onPressWallet={onConfirm}
            sponsoredDisabled={
              !isFeeValid || isLoading || confirmDisabled || isSponsoredLoading
            }
            walletDisabled={
              !isFeeValid || isLoading || confirmDisabled || isSponsoredLoading
            }
            sponsoredLoading={isSponsoredLoading}
            walletLoading={isLoading}
          />

          <View className="mt-4">
            <Button
              label="Cancel"
              variant="secondary"
              size="lg"
              onPress={() => {
                onClose();
                sheetRef.current?.dismiss();
              }}
              disabled={isLoading || isSponsoredLoading}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
