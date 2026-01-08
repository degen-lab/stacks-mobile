import { ChevronRight } from "lucide-react-native";
import React from "react";

import { ActivityIndicator, Pressable, Text, View } from "@/components/ui";

export type MenuItemProps = {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "danger";
  loading?: boolean;
};

export function MenuItem({
  label,
  icon,
  onPress,
  variant = "default",
  loading = false,
}: MenuItemProps) {
  const isPressable = Boolean(onPress) && !loading;
  const danger = variant === "danger";

  return (
    <Pressable
      onPress={onPress}
      disabled={!isPressable}
      className="flex-row items-center justify-between px-5 py-4 active:opacity-90"
      accessibilityRole="button"
    >
      <View className="flex-row items-center gap-3">
        {icon}
        <Text
          className={
            danger
              ? "font-matter text-base text-red-600 dark:text-red-400"
              : "font-matter text-base text-primary dark:text-white"
          }
        >
          {label}
        </Text>
      </View>
      <View className="flex-row items-center">
        {loading ? (
          <ActivityIndicator size="small" className="text-secondary" />
        ) : isPressable && !danger ? (
          <ChevronRight
            size={16}
            className="text-secondary dark:text-sand-400"
          />
        ) : null}
      </View>
    </Pressable>
  );
}
