import React from "react";
import { View, Pressable } from "react-native";
import { Text } from "./text";
import { Delete } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import colors from "./colors";

type Mode = "numeric" | "decimal";
type DecimalSeparator = "." | ",";
type KeyId =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "0"
  | "delete"
  | "decimalSeparator";

type Layout = [KeyId | null, KeyId | null, KeyId | null][];

interface Key {
  id: KeyId;
  accessibilityLabel: string;
  element: React.ReactNode;
}

function getAllKeys(decimalSeparator: DecimalSeparator): Record<KeyId, Key> {
  return {
    "1": { id: "1", accessibilityLabel: "1", element: "1" },
    "2": { id: "2", accessibilityLabel: "2", element: "2" },
    "3": { id: "3", accessibilityLabel: "3", element: "3" },
    "4": { id: "4", accessibilityLabel: "4", element: "4" },
    "5": { id: "5", accessibilityLabel: "5", element: "5" },
    "6": { id: "6", accessibilityLabel: "6", element: "6" },
    "7": { id: "7", accessibilityLabel: "7", element: "7" },
    "8": { id: "8", accessibilityLabel: "8", element: "8" },
    "9": { id: "9", accessibilityLabel: "9", element: "9" },
    "0": { id: "0", accessibilityLabel: "0", element: "0" },
    decimalSeparator: {
      id: "decimalSeparator",
      accessibilityLabel: decimalSeparator,
      element: decimalSeparator,
    },
    delete: {
      id: "delete",
      accessibilityLabel: "delete",
      element: <Delete size={24} color={colors.neutral[900]} />,
    },
  };
}

const layouts: Record<Mode, Layout> = {
  numeric: [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [null, "0", "delete"],
  ],
  decimal: [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["decimalSeparator", "0", "delete"],
  ],
};

function getLayout(
  mode: Mode,
  decimalSeparator: DecimalSeparator,
): (Key | null)[] {
  return layouts[mode].flat().map((id) => {
    if (!id) return null;
    return getAllKeys(decimalSeparator)[id];
  });
}

function updateValue(
  currentValue: string,
  id: KeyId,
  decimalSeparator: DecimalSeparator,
): string {
  switch (id) {
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      if (currentValue === "0") return id;
      return currentValue + id;
    case "decimalSeparator":
      if (currentValue.includes(decimalSeparator)) return currentValue;
      return currentValue
        ? currentValue + decimalSeparator
        : "0" + decimalSeparator;
    case "delete":
      if (currentValue.length <= 1) return "";
      return currentValue.slice(0, -1);
    default:
      return currentValue;
  }
}

interface NumpadKeyProps {
  label: string;
  element: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
}

function NumpadKey({ element, label, onPress, onLongPress }: NumpadKeyProps) {
  return (
    <Pressable
      className="h-full w-full items-center justify-center"
      style={({ pressed }) => ({
        opacity: pressed ? 0.5 : 1,
      })}
      accessibilityLabel={label}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      onLongPress={() => {
        if (onLongPress) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onLongPress();
        }
      }}
    >
      {typeof element === "string" ? (
        <Text className="font-matter text-2xl text-primary">{element}</Text>
      ) : (
        element
      )}
    </Pressable>
  );
}

export interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  decimalSeparator?: DecimalSeparator;
  allowNextValue?: (value: string) => boolean;
  mode?: Mode;
}

export function Numpad({
  value,
  onChange,
  decimalSeparator = ".",
  mode = "decimal",
  allowNextValue,
}: NumpadProps) {
  function handlePress(key: Key) {
    const updatedValue = updateValue(value, key.id, decimalSeparator);
    return () => {
      if (allowNextValue && !allowNextValue(updatedValue)) {
        return;
      }
      onChange(updatedValue);
    };
  }

  function handleLongPress(key: Key) {
    return () => {
      if (key.id === "delete") {
        onChange("");
      }
    };
  }

  return (
    <View className="flex-row flex-wrap gap-y-3" pointerEvents="box-none">
      {getLayout(mode, decimalSeparator).map((keyItem, index) => {
        return (
          <View
            key={keyItem ? keyItem.id : `empty-slot-${index}`}
            className="h-[48px] w-1/3"
          >
            {keyItem ? (
              <NumpadKey
                label={keyItem.accessibilityLabel}
                element={keyItem.element}
                onPress={handlePress(keyItem)}
                onLongPress={handleLongPress(keyItem)}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export default Numpad;
