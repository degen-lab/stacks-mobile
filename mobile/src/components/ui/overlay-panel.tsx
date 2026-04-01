import React from "react";
import { useColorScheme } from "nativewind";
import { View } from "react-native";

type OverlayPanelProps = {
  children: React.ReactNode;
  translucent?: boolean;
};

// this is used for game overlays
export default function OverlayPanel({
  children,
  translucent = true,
}: OverlayPanelProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const backdropClass = translucent
    ? isDark
      ? "bg-black/75"
      : "bg-white/85"
    : "";

  return (
    <View
      className={`absolute inset-0 items-center justify-center px-4 py-8 ${backdropClass}`}
    >
      <View className="w-full max-w-[380px] rounded-[28px] border border-surface-secondary bg-sand-100 p-6 shadow-xl dark:bg-surface-primary">
        {children}
      </View>
    </View>
  );
}
