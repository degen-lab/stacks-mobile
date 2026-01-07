import { colors } from "@/components/ui";
import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";

type PowerUpButtonProps = {
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
  status: string;
  isActive?: boolean;
  isUsed?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function PowerUpButton({
  icon: Icon,
  label,
  status,
  isActive = false,
  isUsed = false,
  disabled = false,
  onPress,
}: PowerUpButtonProps) {
  const backgroundColor = isActive ? colors.neutral[300] : "#EAE8E6";
  const opacity = isUsed && !isActive ? 0.35 : 1;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className="items-center"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{ zIndex: 10 }}
    >
      <View
        className="size-16 items-center justify-center rounded-full border-2 border-border-secondary"
        style={{
          backgroundColor,
          opacity,
        }}
      >
        <Icon size={28} color={colors.neutral[700]} />
      </View>
      <Text className="mt-1 text-xs font-instrument-sans-medium text-neutral-700">
        {label}
      </Text>
      <Text className="text-xs font-instrument-sans-medium text-primary-600">
        {status}
      </Text>
    </Pressable>
  );
}
