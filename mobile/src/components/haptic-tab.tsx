import * as Haptics from "expo-haptics";
import {
  GestureResponderEvent,
  Pressable,
  PressableProps,
  View,
} from "react-native";

export function HapticTab({
  children,
  onPressIn,
  className,
  ...rest
}: PressableProps) {
  // Avoid react-navigation focus hooks here (they require a navigation context
  // which can be briefly unavailable during fast tab transitions).
  // Tabs sets `accessibilityState.selected` for the active tab.
  const isFocused = Boolean(rest.accessibilityState?.selected);
  const borderClass = isFocused
    ? "border-stacks-blood-orange"
    : "border-transparent";

  return (
    <View className={`flex-1 border-t-2 ${borderClass}`}>
      <Pressable
        {...rest}
        className={`flex-1 items-center justify-center ${className ?? ""}`}
        onPressIn={(e: GestureResponderEvent) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressIn?.(e);
        }}
      >
        <View pointerEvents="none">{children}</View>
      </Pressable>
    </View>
  );
}
