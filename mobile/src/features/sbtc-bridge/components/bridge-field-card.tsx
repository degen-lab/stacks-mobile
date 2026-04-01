import type { ReactNode } from "react";
import { ArrowDown, Check, Copy } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Pressable, Text, View, colors } from "@/components/ui";
import { cn } from "tailwind-variants";

export function BridgeFieldCard({
  label,
  helper,
  rightSlot,
  children,
  bgColor = "surface-primary",
}: {
  label: string;
  helper?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  bgColor?: "surface-primary" | "white";
}) {
  const { colorScheme } = useColorScheme();
  const bgClass =
    colorScheme === "dark"
      ? "bg-surface-secondary"
      : bgColor === "white"
        ? "bg-white"
        : "bg-surface-primary";
  return (
    <View
      className={cn(
        "rounded-[12px] border border-surface-secondary px-4 py-3 dark:border-border-primary",
        bgClass,
      )}
    >
      <View className="flex-row items-start justify-between">
        <Text className="font-instrument-sans-semibold text-sm text-secondary">
          {label}
        </Text>
        {rightSlot}
      </View>
      {helper ? (
        <Text className="mt-1 font-instrument-sans text-xs leading-4 text-secondary">
          {helper}
        </Text>
      ) : null}
      <View className="mt-1.5">{children}</View>
    </View>
  );
}

export function BridgeAddressRow({
  address,
  leftSlot,
  onCopy,
  rightLabel,
  onRightPress,
}: {
  address: string;
  leftSlot?: ReactNode;
  onCopy?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const copyIconColor =
    colorScheme === "dark" ? colors.charcoal[300] : colors.neutral[700];
  return (
    <View className="flex-row items-center justify-between gap-2">
      {leftSlot ? <View>{leftSlot}</View> : null}
      <Text className="flex-1 font-instrument-sans-medium text-xs tracking-tighter text-primary">
        {address}
      </Text>
      {rightLabel && onRightPress ? (
        <Pressable onPress={onRightPress} hitSlop={8}>
          <Text className="font-instrument-sans text-sm text-primary underline">
            {rightLabel}
          </Text>
        </Pressable>
      ) : null}
      {onCopy ? (
        <Pressable
          onPress={onCopy}
          className="h-8 w-8 items-center justify-center"
        >
          <Copy size={16} color={copyIconColor} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function BridgeMaxChip({
  onPress,
  isMax,
}: {
  onPress: () => void;
  isMax: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center justify-center gap-0.5 rounded-lg px-2 py-1",
        isMax
          ? "bg-sand-950 dark:bg-surface-primary dark:border dark:border-border-primary"
          : "border-2 border-border-secondary dark:border-border-primary dark:bg-surface-primary",
      )}
    >
      <Text
        className={cn(
          "font-instrument-sans-medium text-xs",
          isMax ? "text-white" : "text-secondary dark:text-primary",
        )}
      >
        Max
      </Text>
      {isMax && <Check size={12} color={colors.white} />}
    </Pressable>
  );
}

export function BridgeDirectionMarker() {
  return (
    <View className="items-center py-1">
      <View className="h-9 w-9 items-center justify-center rounded-full border border-surface-secondary bg-sand-500 dark:border-border-primary dark:bg-surface-secondary">
        <ArrowDown size={16} color={colors.neutral[100]} />
      </View>
    </View>
  );
}
