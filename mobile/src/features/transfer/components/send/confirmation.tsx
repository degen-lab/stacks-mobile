import { View, Button, Text } from "@/components/ui";
import { Toggle } from "@/components/ui/toggle";
import { StxCoin, BtcLogo } from "@/components/ui/icons";
import type { FeeRateTier } from "../../hooks/use-prepare-btc-send";
import type { SendFormData } from "../../types";

const FEE_TIER_OPTIONS: { value: FeeRateTier; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "standard", label: "Standard" },
  { value: "fast", label: "Fast" },
];

type ConfirmationProps = {
  formData: SendFormData;
  fee: string;
  feeAsset?: string;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
  confirmDisabled?: boolean;
  error?: string | null;
  info?: string | null;
  feeRateTier?: FeeRateTier;
  feeRatePerVbyte?: number;
  onFeeRateTierChange?: (tier: FeeRateTier) => void;
};

export function Confirmation({
  formData,
  fee,
  feeAsset,
  onConfirm,
  onBack,
  isLoading,
  confirmDisabled = false,
  error,
  info,
  feeRateTier,
  feeRatePerVbyte,
  onFeeRateTierChange,
}: ConfirmationProps) {
  const getAssetLogo = () => {
    switch (formData.asset) {
      case "STX":
        return <StxCoin size={40} />;
      case "BTC":
      case "sBTC":
        return <BtcLogo size={40} />;
    }
  };

  return (
    <View className="flex-1 px-5 pb-6">
      <View className="rounded-2xl p-6 border-2 border-surface-tertiary bg-surface-primary items-center mb-4">
        <View className="mb-3">{getAssetLogo()}</View>
        <Text className="text-3xl font-matter font-bold text-primary">
          {formData.amount} {formData.asset}
        </Text>
      </View>

      {feeRateTier && onFeeRateTierChange && (
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-instrument-sans text-secondary">
              Fee Rate
            </Text>
            {feeRatePerVbyte != null && (
              <Text className="text-xs font-instrument-sans text-secondary">
                {feeRatePerVbyte} sat/vB
              </Text>
            )}
          </View>
          <View className="self-start">
            <Toggle
              value={feeRateTier}
              options={FEE_TIER_OPTIONS}
              onChange={onFeeRateTierChange}
            />
          </View>
        </View>
      )}

      <View className="rounded-2xl p-4 border-2 border-surface-tertiary bg-surface-primary gap-3 mb-6">
        <View className="flex-row justify-between">
          <Text className="text-sm font-instrument-sans text-secondary">
            To
          </Text>
          <Text
            className="text-sm font-mono text-primary flex-1 text-right ml-2"
            numberOfLines={1}
          >
            {formData.recipient.slice(0, 8)}...{formData.recipient.slice(-8)}
          </Text>
        </View>

        {formData.memo && (
          <View className="flex-row justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Memo
            </Text>
            <Text className="text-sm font-instrument-sans text-primary">
              {formData.memo}
            </Text>
          </View>
        )}

        <View className="flex-row justify-between">
          <Text className="text-sm font-instrument-sans text-secondary">
            Network Fee
          </Text>
          <Text className="text-sm font-instrument-sans text-primary">
            {fee} {feeAsset ?? formData.asset}
          </Text>
        </View>

        <View className="h-px bg-surface-tertiary my-1" />

        <View className="flex-row justify-between">
          <Text className="text-sm font-instrument-sans-medium text-primary">
            Total
          </Text>
          <Text className="text-sm font-instrument-sans-medium text-primary">
            {(Number(formData.amount) || 0) + (Number(fee) || 0)}{" "}
            {formData.asset}
          </Text>
        </View>
      </View>

      {error ? (
        <Text className="text-xs font-instrument-sans text-red-500 text-center mb-4">
          {error}
        </Text>
      ) : info ? (
        <Text className="text-xs font-instrument-sans text-secondary text-center mb-4">
          {info}
        </Text>
      ) : null}

      <Button
        label={isLoading ? "Sending..." : "Confirm & Send"}
        variant="gamePrimary"
        size="lg"
        onPress={onConfirm}
        loading={isLoading}
        disabled={isLoading || confirmDisabled}
      />

      <Text className="text-xs font-instrument-sans text-secondary text-center mt-4">
        This transaction cannot be reversed once confirmed
      </Text>
    </View>
  );
}
