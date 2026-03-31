import { View, Button, Text } from "@/components/ui";
import { Numpad } from "@/components/ui/numpad";
import type { AppToken } from "@/lib/assets/tokens";

type AmountInputProps = {
  asset: AppToken | null;
  amount: string;
  balance: number;
  balanceIsLoading?: boolean;
  onAmountChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLocked?: boolean;
  error?: string | null;
};

export function AmountInput({
  asset,
  amount,
  balance,
  balanceIsLoading = false,
  onAmountChange,
  onNext,
  onBack,
  isLocked = false,
  error,
}: AmountInputProps) {
  const numericAmount = parseFloat(amount) || 0;
  const canValidateBalance = Number.isFinite(balance) && !balanceIsLoading;
  const canEnforceBalance = canValidateBalance && balance > 0;
  const isValid = canValidateBalance
    ? numericAmount > 0 && numericAmount <= balance
    : numericAmount > 0;

  return (
    <View className="flex-1 px-5 pb-6">
      <View className="items-center mb-6">
        <Text className="text-4xl font-instrument-sans-medium text-primary">
          {amount || "0"}
        </Text>
        <Text className="text-sm font-instrument-sans text-secondary mt-2">
          Balance: {balance} {asset}
        </Text>
      </View>

      {/* Numpad */}
      <View className="mb-6">
        <Numpad
          value={amount}
          onChange={onAmountChange}
          mode="decimal"
          allowNextValue={(value) => {
            if (isLocked) return false;
            if (!value || value === ".") return true;
            const num = parseFloat(value);
            if (isNaN(num)) return false;
            const [, decimals = ""] = value.split(".");
            const maxDecimals = asset === "STX" ? 6 : 8;
            if (decimals.length > maxDecimals) return false;
            if (!canEnforceBalance) return true;
            return num <= balance;
          }}
        />
      </View>

      {isLocked ? (
        <Text className="mb-4 text-center text-xs font-instrument-sans text-secondary">
          Amount is locked for this transfer.
        </Text>
      ) : null}

      {error ? (
        <Text className="mb-4 text-center text-xs font-instrument-sans text-red-500">
          {error}
        </Text>
      ) : null}

      <Button
        label="Continue"
        variant="gamePrimary"
        size="lg"
        onPress={onNext}
        disabled={!isValid}
      />
    </View>
  );
}
