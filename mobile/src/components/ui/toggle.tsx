import { ReactNode } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "nativewind";

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
  variant?: "default" | "card";
  testIDPrefix?: string;
};

function ToggleItem<T extends string>({
  option,
  active,
  onPress,
  testID,
  variant,
  activeStyle,
}: {
  option: ToggleOption<T>;
  active: boolean;
  onPress: () => void;
  testID?: string;
  variant: "default" | "card";
  activeStyle: ReturnType<typeof StyleSheet.flatten>;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.item,
        active ? activeStyle : styles.inactiveItem,
        variant === "card" ? styles.itemCard : null,
      ]}
    >
      <View style={styles.itemContent}>
        {option.icon ? (
          <View style={styles.itemIcon}>{option.icon}</View>
        ) : null}
        <Text
          className={`font-instrument-sans-semibold text-sm ${active ? "text-white" : "text-sand-900"}`}
        >
          {option.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function Toggle<T extends string>({
  value,
  options,
  onChange,
  variant = "default",
  testIDPrefix,
}: ToggleProps<T>) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const activeItemStyle = {
    backgroundColor: colors.neutral[800],
    shadowColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(213, 211, 209, 0.4)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  };

  const containerStyle =
    variant === "default"
      ? { borderColor: isDark ? colors.charcoal[700] : colors.neutral[300] }
      : null;

  const cardStyle =
    variant === "card"
      ? {
          borderRadius: 12,
          borderColor: isDark ? colors.charcoal[700] : "#D5D3D1",
          backgroundColor: isDark ? colors.charcoal[900] : "#F7F6F5",
          padding: 6,
        }
      : null;

  return (
    <View style={[styles.container, containerStyle, cardStyle]}>
      {options.map((option, index) => (
        <View
          key={option.value}
          style={index === 0 ? null : styles.itemSpacing}
        >
          <ToggleItem
            option={option}
            active={value === option.value}
            onPress={() => onChange(option.value)}
            testID={
              testIDPrefix
                ? `${testIDPrefix}-${String(option.value)}`
                : undefined
            }
            variant={variant}
            activeStyle={activeItemStyle}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: "transparent",
  },
  itemSpacing: {
    marginLeft: 4,
  },
  item: {
    minWidth: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    marginRight: 4,
  },
  inactiveItem: {
    backgroundColor: "transparent",
  },
  itemCard: {
    borderRadius: 8,
  },
});
