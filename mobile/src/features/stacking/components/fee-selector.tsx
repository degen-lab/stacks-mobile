import { Button, Text, View } from "@/components/ui";
import { ActivityIndicator } from "react-native";

export type FeeOption = "low" | "standard" | "high" | "custom";

type FeeSelectorProps = {
  selectedFee: FeeOption;
  onSelectFee: (option: FeeOption) => void;
  isLoading?: boolean;
  showCustom?: boolean;
};

export function FeeSelector({
  selectedFee,
  onSelectFee,
  isLoading,
  showCustom = true,
}: FeeSelectorProps) {
  if (isLoading) {
    return (
      <View className="rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3">
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" />
          <Text className="text-sm font-instrument-sans text-secondary">
            Calculating fee…
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row gap-2">
      {(["low", "standard", "high"] as FeeOption[]).map((option) => (
        <Button
          key={option}
          label={option.charAt(0).toUpperCase() + option.slice(1)}
          variant={selectedFee === option ? "default" : "outline"}
          size="sm"
          className="flex-1 rounded-xl"
          onPress={() => onSelectFee(option)}
        />
      ))}

      {showCustom ? (
        <Button
          label="Custom"
          variant={selectedFee === "custom" ? "default" : "outline"}
          size="sm"
          className="flex-1 rounded-xl"
          onPress={() => onSelectFee("custom")}
        />
      ) : null}
    </View>
  );
}
