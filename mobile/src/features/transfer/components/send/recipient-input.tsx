import type { AppToken } from "@/lib/assets/tokens";
import { View, Button, Text } from "@/components/ui";
import { Input } from "@/components/ui/input";

type RecipientInputProps = {
  asset: AppToken | null;
  recipient: string;
  memo: string;
  onRecipientChange: (value: string) => void;
  onMemoChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  recipientError?: string | null;
  recipientLocked?: boolean;
  memoLocked?: boolean;
};

export function RecipientInput({
  asset,
  recipient,
  memo,
  onRecipientChange,
  onMemoChange,
  onNext,
  onBack,
  recipientError,
  recipientLocked = false,
  memoLocked = false,
}: RecipientInputProps) {
  const supportsMemo = asset === "STX";
  const assetLabel = asset ?? "crypto";

  return (
    <View className="flex-1 px-5 pb-6">
      <View className="gap-4 mb-6">
        <View>
          <Text className="text-sm font-instrument-sans text-secondary mb-2">
            Recipient Address
          </Text>
          <Input
            placeholder={`Enter ${assetLabel} address`}
            value={recipient}
            onChangeText={onRecipientChange}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!recipientLocked}
            disabled={recipientLocked}
          />
          {recipientError ? (
            <Text className="text-xs font-instrument-sans text-red-500 mt-1">
              {recipientError}
            </Text>
          ) : null}
        </View>

        {supportsMemo ? (
          <View>
            <Text className="text-sm font-instrument-sans text-secondary mb-2">
              Memo (Optional)
            </Text>
            <Input
              placeholder="Add a note"
              value={memo}
              onChangeText={onMemoChange}
              maxLength={34}
              editable={!memoLocked}
              disabled={memoLocked}
            />
            <Text className="text-xs font-instrument-sans text-secondary mt-1">
              {memo.length}/34 characters
            </Text>
          </View>
        ) : null}
      </View>

      <Button
        label="Continue"
        variant="gamePrimary"
        size="lg"
        onPress={onNext}
        disabled={!recipient || !!recipientError}
      />

      <Text className="text-xs font-instrument-sans text-secondary text-center mt-4">
        Double-check the recipient address. Transactions cannot be reversed.
      </Text>
    </View>
  );
}
