import React from "react";
import { View } from "react-native";
import { Text, Modal } from "@/components/ui";
import { FeeOption } from "./fee-selector";
import { ContractTxDetails } from "@/components/contract-tx-details";
import {
  BottomSheetScrollView,
  type BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { TransactionFundingActions } from "@/components/transaction-funding-actions";

interface ApprovePoolSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
  network: string;
  poolAddress: string;
  poxContract: string;
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
  /** Default is “Approve Pool”; use “Step 1: …” when guiding next-cycle flow. */
  sheetTitle?: string;
}

export function ApprovePoolSheet({
  sheetRef,
  onClose,
  network,
  poolAddress,
  poxContract,
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
  sheetTitle = "Approve Pool",
}: ApprovePoolSheetProps) {
  const [showAdvancedOnly, setShowAdvancedOnly] = React.useState(false);

  return (
    <Modal ref={sheetRef} enableDynamicSizing={true} onDismiss={onClose}>
      <BottomSheetScrollView
        contentContainerClassName="px-6 pb-6"
        showsVerticalScrollIndicator={false}
      >
        <ContractTxDetails
          network={network}
          title={sheetTitle}
          contractAddress={poxContract}
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
          onAdvancedToggle={setShowAdvancedOnly}
        />

        {!showAdvancedOnly && (
          <View>
            <Text className="mb-4 font-instrument-sans text-sm leading-relaxed text-secondary">
              Approve Fast Pool to lock your STX. One-time action.
            </Text>

            <TransactionFundingActions
              sponsoredLabel="Watch an ad"
              walletLabel="Use wallet funds"
              onPressSponsored={onSponsoredConfirm}
              onPressWallet={onConfirm}
              sponsoredDisabled={!isFeeValid || isLoading || confirmDisabled}
              walletDisabled={
                !isFeeValid || isSponsoredLoading || confirmDisabled
              }
              sponsoredLoading={isSponsoredLoading}
              walletLoading={isLoading}
            />
          </View>
        )}
      </BottomSheetScrollView>
    </Modal>
  );
}
