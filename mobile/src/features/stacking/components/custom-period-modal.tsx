import { useState } from "react";
import { useColorScheme } from "nativewind";
import { View, Text, Pressable, Modal, TextInput } from "react-native";
import { Button, colors } from "@/components/ui";
import { X } from "lucide-react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (weeks: number) => void;
};

export function CustomPeriodModal({ visible, onClose, onApply }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [customInput, setCustomInput] = useState("");
  const [customUnit, setCustomUnit] = useState<"weeks" | "months" | "years">(
    "months",
  );

  const convertToWeeks = (
    value: number,
    unit: "weeks" | "months" | "years",
  ): number => {
    if (unit === "weeks") return value;
    if (unit === "months") return Math.round(value * (52 / 12));
    if (unit === "years") return value * 52;
    return value;
  };

  const handleApply = () => {
    const numValue = Number(customInput);
    if (numValue && numValue > 0) {
      const weeksValue = convertToWeeks(numValue, customUnit);
      if (weeksValue >= 2 && weeksValue <= 520) {
        onApply(weeksValue);
        onClose();
        // Reset state after successful apply if desired, or keep it for next time
        setCustomInput("");
        setCustomUnit("months");
      }
    }
  };
  const closeIconColor = isDark ? colors.charcoal[300] : colors.neutral[900];
  const placeholderTextColor = isDark
    ? colors.charcoal[500]
    : colors.neutral[400];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-[24px] bg-surface-tertiary p-6 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-matter text-xl text-primary">
              Custom Period
            </Text>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-surface-secondary"
            >
              <X size={20} color={closeIconColor} />
            </Pressable>
          </View>

          <View className="mb-3 rounded-2xl border border-surface-secondary bg-sand-100 p-4 dark:bg-surface-primary">
            <TextInput
              className="border-0 bg-transparent p-0 font-matter text-3xl text-primary"
              placeholder="0"
              keyboardType="numeric"
              value={customInput}
              onChangeText={setCustomInput}
              placeholderTextColor={placeholderTextColor}
              autoFocus
            />
          </View>

          <View className="mb-4 flex-row gap-2">
            {(["weeks", "months", "years"] as const).map((unit) => (
              <Pressable
                key={unit}
                onPress={() => setCustomUnit(unit)}
                className={`flex-1 rounded-full py-2 ${
                  isDark
                    ? customUnit === unit
                      ? "border border-sand-300 bg-sand-100"
                      : "border border-surface-secondary bg-surface-primary"
                    : customUnit === unit
                      ? "border border-sand-600 bg-sand-900"
                      : "border border-sand-300 bg-sand-100"
                }`}
              >
                <Text
                  className={`text-center text-sm font-instrument-sans-medium capitalize ${
                    isDark
                      ? customUnit === unit
                        ? "text-sand-900"
                        : "text-primary"
                      : customUnit === unit
                        ? "text-white"
                        : "text-primary"
                  }`}
                >
                  {unit}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            label="Apply"
            variant="gamePrimary"
            size="lg"
            onPress={handleApply}
            disabled={!customInput || Number(customInput) <= 0}
          />

          <Text className="text-center text-xs font-instrument-sans text-secondary mt-3">
            Min 1 cycle (2 weeks) • Max 260 cycles (10 years)
          </Text>
        </View>
      </View>
    </Modal>
  );
}
