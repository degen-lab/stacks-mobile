import { Text, View } from "@/components/ui";
import { Toggle } from "@/components/ui/toggle";
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
  const options: { value: FeeOption; label: string }[] = showCustom
    ? [
        { value: "low", label: "Low" },
        { value: "standard", label: "Standard" },
        { value: "high", label: "High" },
        { value: "custom", label: "Custom" },
      ]
    : [
        { value: "low", label: "Low" },
        { value: "standard", label: "Standard" },
        { value: "high", label: "High" },
      ];

  if (isLoading) {
    return (
      <View className="rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3 dark:bg-surface-primary">
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
    <View className="self-start">
      <Toggle value={selectedFee} options={options} onChange={onSelectFee} />
    </View>
  );
}
