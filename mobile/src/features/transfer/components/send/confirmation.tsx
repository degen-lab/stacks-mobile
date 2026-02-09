import { View, Button, Text } from "@/components/ui";
import { StxCoin, BtcLogo } from "@/components/ui/icons";
import type { SendFormData } from "../../types";

type ConfirmationProps = {
  formData: SendFormData;
  fee: string;
  onConfirm: () => void;
  onBack: () => void;
  isLoading?: boolean;
};

export function Confirmation({
  formData,
  fee,
  onConfirm,
  onBack,
  isLoading,
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
      <View className="rounded-2xl p-6 border-2 border-surface-tertiary bg-surface-primary items-center mb-6">
        <View className="mb-3">{getAssetLogo()}</View>
        <Text className="text-3xl font-matter font-bold text-primary">
          {formData.amount} {formData.asset}
        </Text>
      </View>

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
            {fee} STX
          </Text>
        </View>

        <View className="h-px bg-surface-tertiary my-1" />

        <View className="flex-row justify-between">
          <Text className="text-sm font-instrument-sans-medium text-primary">
            Total
          </Text>
          <Text className="text-sm font-instrument-sans-medium text-primary">
            {parseFloat(formData.amount) + parseFloat(fee)} {formData.asset}
          </Text>
        </View>
      </View>

      <Button
        label={isLoading ? "Sending..." : "Confirm & Send"}
        variant="gamePrimary"
        size="lg"
        onPress={onConfirm}
        loading={isLoading}
        disabled={isLoading}
      />

      <Text className="text-xs font-instrument-sans text-secondary text-center mt-4">
        This transaction cannot be reversed once confirmed
      </Text>
    </View>
  );
}
