import { View, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Text } from "../text";

type SelectionCardProps = {
  /** Icon to display on the left */
  icon: ReactNode;
  /** Whether to wrap icon in a circular background */
  iconCircular?: boolean;
  /** Main title text */
  title: string;
  /** Subtitle/description text or element */
  subtitle?: string | ReactNode;
  /** Optional right-side content (badges, buttons, etc.) */
  rightContent?: ReactNode;
  /** Optional bottom content (loading state, etc.) */
  bottomContent?: ReactNode;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Optional press handler - if not provided, card won't be pressable */
  onPress?: () => void;
  /** Whether to trigger haptic feedback on press */
  haptics?: boolean;
};

export function SelectionCard({
  icon,
  iconCircular = false,
  title,
  subtitle,
  rightContent,
  bottomContent,
  disabled = false,
  onPress,
  haptics = true,
}: SelectionCardProps) {
  const handlePress = () => {
    if (disabled || !onPress) return;
    if (haptics) {
      Haptics.selectionAsync();
    }
    onPress();
  };

  const content = (
    <>
      <View className="flex-row items-center gap-3">
        {/* Icon */}
        {iconCircular ? (
          <View className="w-10 h-10 rounded-full bg-surface-secondary items-center justify-center">
            {icon}
          </View>
        ) : (
          <View>{icon}</View>
        )}

        <View className="flex-1">
          <Text className="text-lg font-matter font-semibold text-primary">
            {title}
          </Text>
          {subtitle &&
            (typeof subtitle === "string" ? (
              <Text className="text-sm font-instrument-sans text-secondary mt-0.5">
                {subtitle}
              </Text>
            ) : (
              subtitle
            ))}
        </View>

        {/* Right content (buttons, badges, etc.) */}
        {rightContent && <View>{rightContent}</View>}
      </View>

      {/* Bottom content (loading, error messages, etc.) */}
      {bottomContent && <View className="mt-3">{bottomContent}</View>}
    </>
  );

  if (!onPress) {
    return (
      <View
        className="rounded-2xl p-4 border-2 border-surface-tertiary bg-surface-primary"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className="rounded-2xl p-4 border-2 border-surface-tertiary bg-surface-primary"
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}
