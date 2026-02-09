import { View, Pressable } from "react-native";
import { Text, colors } from "@/components/ui";
import * as Haptics from "expo-haptics";
import type { AssetOption } from "../types";

export type AssetOptionConfig = {
  id: AssetOption;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
};

type Props = {
  options: AssetOptionConfig[];
  selectedAsset: AssetOption;
  onSelect: (asset: AssetOption) => void;
};

export function AssetSelector({ options, selectedAsset, onSelect }: Props) {
  return (
    <View className="flex-row gap-3 mb-6">
      {options.map((item) => {
        const isSelected = selectedAsset === item.id;
        const isDisabled = item.disabled;
        return (
          <Pressable
            key={item.id}
            onPress={() => {
              if (isDisabled) return;
              onSelect(item.id);
              Haptics.selectionAsync();
            }}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl border py-3 ${
              isSelected
                ? "border-primary bg-surface-secondary"
                : "border-surface-secondary bg-surface-primary"
            } ${isDisabled ? "opacity-50" : ""}`}
            style={
              isSelected
                ? {
                    borderColor: colors.primary[500],
                    backgroundColor: colors.neutral[200],
                  }
                : {}
            }
          >
            <View className={isSelected ? "opacity-100" : "opacity-50"}>
              {item.icon}
            </View>
            <Text
              className={`font-instrument-sans-medium text-sm ${
                isSelected ? "text-primary" : "text-secondary"
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
