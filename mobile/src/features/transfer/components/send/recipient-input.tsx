import { View, Button, Text } from "@/components/ui";
import { Input } from "@/components/ui/input";

type RecipientInputProps = {
  asset: string;
  recipient: string;
  memo: string;
  onRecipientChange: (value: string) => void;
  onMemoChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function RecipientInput({
  asset,
  recipient,
  memo,
  onRecipientChange,
  onMemoChange,
  onNext,
  onBack,
}: RecipientInputProps) {
  return (
    <View className="flex-1 px-5 pb-6">
      <View className="gap-4 mb-6">
        <View>
          <Text className="text-sm font-instrument-sans text-secondary mb-2">
            Recipient Address
          </Text>
          <Input
            placeholder={`Enter ${asset} address`}
            value={recipient}
            onChangeText={onRecipientChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View>
          <Text className="text-sm font-instrument-sans text-secondary mb-2">
            Memo (Optional)
          </Text>
          <Input
            placeholder="Add a note"
            value={memo}
            onChangeText={onMemoChange}
            maxLength={34}
          />
          <Text className="text-xs font-instrument-sans text-secondary mt-1">
            {memo.length}/34 characters
          </Text>
        </View>
      </View>

      <Button
        label="Continue"
        variant="gamePrimary"
        size="lg"
        onPress={onNext}
        disabled={!recipient}
      />

      <Text className="text-xs font-instrument-sans text-secondary text-center mt-4">
        Double-check the recipient address. Transactions cannot be reversed.
      </Text>
    </View>
  );
}
