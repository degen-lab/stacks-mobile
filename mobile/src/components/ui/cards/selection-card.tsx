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
  /** Optional alignment for the right-side content */
  rightContentAlign?: "center" | "top";
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
  rightContentAlign = "center",
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
      <View className="flex-row gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          {/* Icon */}
          {iconCircular ? (
            <View className="w-10 h-10 rounded-full bg-surface-secondary items-center justify-center">
              {icon}
            </View>
          ) : (
            <View>{icon}</View>
          )}

          <View className="flex-1">
            <Text className="text-lg font-matter font-semibold leading-6 text-primary">
              {title}
            </Text>
            {subtitle &&
              (typeof subtitle === "string" ? (
                <Text className="mt-0.5 text-sm font-instrument-sans leading-5 text-secondary">
                  {subtitle}
                </Text>
              ) : (
                subtitle
              ))}
          </View>
        </View>

        {/* Right content (buttons, badges, etc.) */}
        {rightContent && (
          <View
            className={
              rightContentAlign === "top"
                ? "shrink-0 self-start"
                : "shrink-0 self-center"
            }
          >
            {rightContent}
          </View>
        )}
      </View>

      {/* Bottom content (loading, error messages, etc.) */}
      {bottomContent && <View className="mt-3">{bottomContent}</View>}
    </>
  );

  if (!onPress) {
    return (
      <View
        className="rounded-2xl border-2 border-surface-tertiary bg-surface-primary p-4 dark:border dark:border-surface-secondary"
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
      className="rounded-2xl border-2 border-surface-tertiary bg-surface-primary p-4 dark:border dark:border-surface-secondary"
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}
