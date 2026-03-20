import type { ReactNode } from "react";
import { ArrowDown, Check, Copy } from "lucide-react-native";

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
  return (
    <View className={cn("rounded-[12px] px-4 py-3", `bg-${bgColor}`)}>
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
          <Copy size={16} color={colors.neutral[700]} />
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
        isMax ? "bg-sand-950" : "border-2 border-border-secondary",
      )}
    >
      <Text
        className={cn(
          "font-instrument-sans-medium text-xs",
          isMax ? "text-white" : "text-secondary",
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
      <View className="h-9 w-9 items-center justify-center rounded-full bg-sand-500">
        <ArrowDown size={16} color={colors.neutral[100]} />
      </View>
    </View>
  );
}
