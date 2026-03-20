import { type ReactNode } from "react";
import { TextInput as RNTextInput } from "react-native";

import { Text, View, colors } from "@/components/ui";
import { fromSatsToBtc } from "@/lib/format/currency";
import { LockIcon } from "@/components/ui/icons/lock-icon";

import { sanitizeDecimal } from "@/lib/format/decimal";
import { BridgeFieldCard, BridgeMaxChip } from "./bridge-field-card";

type AmountFieldCardBgColor = "surface-primary" | "white";

export function BridgeAmountFieldCard({
  label,
  value,
  unit,
  placeholder = "0.00000000",
  rightSlot,
  helper,
  bgColor = "surface-primary",
  error,
  startIcon,
  locked = false,
  maxValue,
  onChangeText,
  onMax,
}: {
  label: string;
  value: string;
  unit: string;
  placeholder?: string;
  rightSlot?: ReactNode;
  helper?: string;
  bgColor?: AmountFieldCardBgColor;
  error?: string | null;
  startIcon?: ReactNode;
  locked?: boolean;
  maxValue?: string;
  onChangeText?: (value: string) => void;
  onMax?: () => void;
}) {
  const hasValue = value.trim().length > 0;
  const isEditable = !locked && Boolean(onChangeText);

  return (
    <BridgeFieldCard
      label={label}
      helper={helper}
      rightSlot={rightSlot}
      bgColor={bgColor}
    >
      {isEditable ? (
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            {startIcon ? <View>{startIcon}</View> : null}
            <View className="min-w-0 shrink flex-row items-center gap-1">
              {/* Hidden mirror sizes this container to text width so unit stays adjacent to the number */}
              <View className="relative min-w-4">
                <Text
                  className="p-0 font-matter text-xl leading-5 text-transparent"
                  style={{ includeFontPadding: false, paddingRight: 2 }}
                  aria-hidden
                >
                  {hasValue ? value : placeholder}
                </Text>
                <RNTextInput
                  value={value}
                  onChangeText={(nextValue) =>
                    onChangeText?.(sanitizeDecimal(nextValue, 8))
                  }
                  keyboardType="decimal-pad"
                  placeholder={placeholder}
                  placeholderTextColor={colors.neutral[500]}
                  className={`absolute inset-0 p-0 font-matter text-xl leading-5 ${hasValue ? "text-primary" : "text-sand-500"}`}
                  style={{ includeFontPadding: false }}
                />
              </View>
              <Text
                className="shrink-0 p-0 font-matter text-xl leading-5 text-sand-500 -translate-y-px"
                style={{ includeFontPadding: false }}
              >
                {unit}
              </Text>
            </View>
          </View>
          {onMax && maxValue !== undefined ? (
            <BridgeMaxChip onPress={onMax} isMax={value === maxValue} />
          ) : null}
        </View>
      ) : (
        <View className="min-w-0 flex-row items-center gap-2">
          {startIcon ? <View>{startIcon}</View> : null}
          <View className="min-w-0 shrink flex-row items-baseline gap-1">
            <View className="relative min-w-4">
              <Text
                className="p-0 font-matter text-xl leading-5 text-primary"
                style={{ includeFontPadding: false }}
              >
                {value}
              </Text>
            </View>
            <Text
              className="shrink-0 p-0 font-matter text-xl leading-5 text-sand-500"
              style={{ includeFontPadding: false }}
            >
              {unit}
            </Text>
            {locked ? (
              <View className="shrink-0 self-end">
                <LockIcon size={18} />
              </View>
            ) : null}
          </View>
        </View>
      )}
      {error ? (
        <Text className="mt-3 font-instrument-sans italic text-sm text-red-500">
          {error}
        </Text>
      ) : null}
    </BridgeFieldCard>
  );
}

export function formatAmountFromSats(value: number) {
  return fromSatsToBtc(value).toLocaleString(undefined, {
    maximumFractionDigits: 8,
  });
}
