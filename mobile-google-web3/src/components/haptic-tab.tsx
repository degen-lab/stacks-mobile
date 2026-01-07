import { useIsFocused } from "@react-navigation/native";
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
  const isFocused = useIsFocused();
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
        {children}
      </Pressable>
    </View>
  );
}
