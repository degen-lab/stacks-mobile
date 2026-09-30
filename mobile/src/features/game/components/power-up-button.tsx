import { colors } from "@/components/ui";
import { useColorScheme } from "nativewind";
import type { ComponentType } from "react";
import { Pressable, Text, View } from "react-native";
import { VISUAL_CONFIG } from "../config";

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const backgroundColor = isDark
    ? isActive
      ? VISUAL_CONFIG.DARK_SCENE.POWER_UP_BG_ACTIVE
      : VISUAL_CONFIG.DARK_SCENE.POWER_UP_BG
    : isActive
      ? colors.neutral[300]
      : "#EAE8E6";
  const iconColor = isDark
    ? VISUAL_CONFIG.DARK_SCENE.HUD_SCORE
    : colors.neutral[700];
  const borderColor = isDark
    ? VISUAL_CONFIG.DARK_SCENE.POWER_UP_BORDER
    : undefined;
  const labelColor = isDark
    ? VISUAL_CONFIG.DARK_SCENE.POWER_UP_LABEL
    : undefined;
  const statusColor = isDark
    ? VISUAL_CONFIG.DARK_SCENE.POWER_UP_STATUS
    : undefined;
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
          ...(borderColor ? { borderColor } : null),
        }}
      >
        <Icon size={28} color={iconColor} />
      </View>
      <Text
        className="mt-1 text-xs font-instrument-sans-medium text-secondary"
        style={labelColor ? { color: labelColor } : undefined}
      >
        {label}
      </Text>
      <Text
        className="text-xs font-instrument-sans-medium text-primary"
        style={statusColor ? { color: statusColor } : undefined}
      >
        {status}
      </Text>
    </Pressable>
  );
}
