import { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import colors from "@/components/ui/colors";
import { Text } from "@/components/ui/text";

export type ToggleOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
};

type ToggleProps<T extends string> = {
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
};

function ToggleItem<T extends string>({
  option,
  active,
  onPress,
}: {
  option: ToggleOption<T>;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.item, active ? styles.activeItem : styles.inactiveItem]}
    >
      {option.icon}
      <Text
        className={`font-instrument-sans-semibold text-sm ${active ? "text-white" : "text-sand-900"}`}
      >
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}

export function Toggle<T extends string>({
  value,
  options,
  onChange,
}: ToggleProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option) => (
        <ToggleItem
          key={option.value}
          option={option}
          active={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: "transparent",
  },
  item: {
    minWidth: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeItem: {
    backgroundColor: colors.neutral[800],
    shadowColor: "rgba(213, 211, 209, 0.4)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  inactiveItem: {
    backgroundColor: "transparent",
  },
});
