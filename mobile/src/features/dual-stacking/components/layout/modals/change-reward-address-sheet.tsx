import { principalCV } from "@stacks/transactions";
import { useColorScheme } from "nativewind";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView } from "react-native";

import { useGetLatestRewardAddressUser } from "@/api/dual-stacking/contract";
import { ContractCallDetailsSheet } from "@/components/contract-call-details-sheet";
import { Button, Input, Modal, Text, View, colors } from "@/components/ui";
import { useModal } from "@/components/ui/modal";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import {
  isValidPrincipal,
  principalArgFromAddress,
} from "@/lib/stacks/addresses";
import { CONTRACTS, SC_FUNCTIONS } from "@/lib/stacks/contracts";
import { useSelectedNetwork } from "@/lib/store/settings";
import {
  FUTURE_MIGRATION_ID,
  getContractTypeForCycle,
} from "@/lib/stacks/utils";

type ChangeRewardAddressSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangeRewardAddress: (params: {
    rewardAddress: string;
    feeMicroStx?: number;
  }) => Promise<boolean>;
};

export function ChangeRewardAddressSheet({
  open,
  onOpenChange,
  onChangeRewardAddress,
}: ChangeRewardAddressSheetProps) {
  const {
    ref: formRef,
    present: presentForm,
    dismiss: dismissForm,
  } = useModal();
  const {
    ref: confirmRef,
    present: presentConfirm,
    dismiss: dismissConfirm,
  } = useModal();
  const { colorScheme } = useColorScheme();
  const { stxAddress } = useWalletAddresses();
  const { selectedNetwork } = useSelectedNetwork();
  const principalArg = useMemo(
    () => principalArgFromAddress(stxAddress),
    [stxAddress],
  );
  const { data: latestAddress, refetch } =
    useGetLatestRewardAddressUser(principalArg);
  const contractType = getContractTypeForCycle(FUTURE_MIGRATION_ID);
  const contractId = CONTRACTS[selectedNetwork][contractType];
  const functionName =
    SC_FUNCTIONS[contractType].publicFunctions.CHANGE_REWARDS_ADDRESS;

  const [rewardAddress, setRewardAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const normalizedAddress = rewardAddress.trim();

  const isAddressValid = isValidPrincipal(normalizedAddress);
  const isSameAddress =
    typeof latestAddress === "string" &&
    latestAddress.length > 0 &&
    normalizedAddress === latestAddress;

  const feeFunctionArgs = useMemo(
    () => (isAddressValid ? [principalCV(normalizedAddress)] : []),
    [isAddressValid, normalizedAddress],
  );

  const activeSheetRef = useRef<"form" | "confirm" | "none">("none");
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      activeSheetRef.current = "form";
      void refetch();
      presentForm();
    } else {
      isClosingRef.current = true;
      activeSheetRef.current = "none";
      dismissForm();
      dismissConfirm();
      setRewardAddress("");
      setIsSubmitting(false);
      setHasUserEdited(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || hasUserEdited) return;
    if (typeof latestAddress === "string" && latestAddress.length > 0) {
      setRewardAddress(latestAddress);
    }
  }, [hasUserEdited, latestAddress, open]);

  const handleAddressChange = (value: string) => {
    setRewardAddress(value);
    if (!hasUserEdited) {
      setHasUserEdited(true);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleOpenConfirm = () => {
    if (isSubmitting || activeSheetRef.current !== "form") return;
    activeSheetRef.current = "confirm";
    dismissForm();
    presentConfirm();
  };

  const handleReturnToForm = () => {
    if (
      isSubmitting ||
      isClosingRef.current ||
      activeSheetRef.current !== "confirm"
    )
      return;
    activeSheetRef.current = "form";
    dismissConfirm();
    presentForm();
  };

  const handleConfirm = async (feeMicroStx?: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await onChangeRewardAddress({
        rewardAddress: normalizedAddress,
        feeMicroStx,
      });
      if (ok) {
        onOpenChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        ref={formRef}
        snapPoints={["55%"]}
        backgroundStyle={{
          backgroundColor:
            colorScheme === "dark" ? colors.charcoal[850] : colors.white,
        }}
        enablePanDownToClose
        onDismiss={() => {
          if (activeSheetRef.current === "form") {
            handleClose();
          }
        }}
      >
        <ScrollView className="flex-1" contentContainerClassName="pb-6">
          <View className="px-6">
            <Text className="mb-3 font-matter text-2xl text-primary">
              Change reward address
            </Text>
            <Text className="mb-6 text-sm font-instrument-sans leading-relaxed text-secondary">
              Update the address where you receive pool rewards. Make sure it is
              a valid Stacks principal.
            </Text>

            <View className="mb-6 gap-3">
              <Text className="font-matter text-xl text-primary">
                Current reward address
              </Text>
              <Input
                value={rewardAddress}
                onChangeText={handleAddressChange}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="ST..."
                editable={!isSubmitting}
                className="px-4 font-matter-sq-mono"
              />
              {!isAddressValid && rewardAddress.length > 0 && (
                <Text className="font-instrument-sans text-xs text-red-600">
                  Enter a valid Stacks principal address.
                </Text>
              )}
              {isAddressValid && isSameAddress && (
                <Text className="font-instrument-sans text-xs text-secondary">
                  This is already your current reward address.
                </Text>
              )}
            </View>

            <View className="gap-3">
              <Button
                label="Change address"
                variant="gamePrimary"
                size="lg"
                onPress={handleOpenConfirm}
                disabled={!isAddressValid || isSameAddress || isSubmitting}
              />
              <Button
                label="Cancel"
                variant="secondary"
                size="lg"
                onPress={handleClose}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </Modal>

      <ContractCallDetailsSheet
        ref={confirmRef}
        title="Change reward address"
        snapPoints={["45%"]}
        network={selectedNetwork}
        contractAddress={contractId}
        functionName={functionName}
        contractArgs={[
          {
            name: "new-address",
            value: normalizedAddress,
            type: "principal",
          },
        ]}
        feeFunctionArgs={feeFunctionArgs}
        showFeeSelector
        confirmLabel="Change address"
        onConfirm={(feeMicroStx) => {
          void handleConfirm(feeMicroStx);
        }}
        onClose={handleReturnToForm}
        isLoading={isSubmitting}
        confirmDisabled={isSubmitting}
      />
    </>
  );
}
