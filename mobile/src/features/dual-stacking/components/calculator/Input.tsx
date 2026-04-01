import { useEffect, useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { useColorScheme } from "nativewind";

import { Text } from "@/components/ui/text";
import colors from "@/components/ui/colors";
import { sanitizeDecimal } from "@/lib/format/decimal";

function addThousandsSeparators(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDisplayValue(value: string) {
  if (!value) return "";

  const [integerPart = "0", fractionPart] = value.split(".");
  const safeInteger = integerPart === "" ? "0" : integerPart;
  const groupedInteger = addThousandsSeparators(safeInteger);

  if (fractionPart == null) {
    return groupedInteger;
  }

  if (fractionPart.length === 0) {
    return `${groupedInteger}.`;
  }

  return `${groupedInteger}.${fractionPart}`;
}

type ProjectRewardsInputProps = {
  label: string;
  icon: React.ReactNode;
  variant?: "sbtc-icon" | "stx-icon";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  errorText?: string;
  disabled?: boolean;
  headerRight?: React.ReactNode;
  maxDecimals?: number;
};

export function ProjectRewardsInput({
  label,
  icon,
  variant = "sbtc-icon",
  value,
  onChange,
  placeholder,
  errorText,
  disabled = false,
  headerRight,
  maxDecimals = 8,
}: ProjectRewardsInputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const borderColor = errorText
    ? "#DC2626"
    : isDark
      ? colors.charcoal[700]
      : colors.neutral[300];
  const placeholderColor = isDark ? colors.charcoal[500] : colors.neutral[400];

  const [isFocused, setIsFocused] = useState(false);
  const [editingValue, setEditingValue] = useState(value);

  useEffect(() => {
    if (!isFocused) {
      setEditingValue(value);
    }
  }, [isFocused, value]);

  const displayValue = useMemo(() => {
    if (isFocused) return editingValue;
    return formatDisplayValue(value);
  }, [editingValue, isFocused, value]);

  return (
    <View className="flex-1">
      <View className="mb-1.5 flex-row items-center justify-between gap-2 pl-2">
        <Text className="font-instrument-sans-medium text-[14px] leading-5 text-primary">
          {label}
        </Text>
        {headerRight}
      </View>

      <View>
        <View
          pointerEvents="none"
          className={`absolute top-0 bottom-0 left-[11px] z-10 items-center justify-center ${
            disabled ? "opacity-50" : "opacity-100"
          }`}
        >
          {icon}
        </View>

        <TextInput
          value={displayValue}
          onChangeText={(nextValue) => {
            const sanitizedValue = sanitizeDecimal(nextValue, maxDecimals);
            setEditingValue(sanitizedValue);
            onChange(sanitizedValue);
          }}
          onFocus={() => {
            setEditingValue(value);
            setIsFocused(true);
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          editable={!disabled}
          keyboardType="decimal-pad"
          autoCorrect={false}
          autoCapitalize="none"
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          selectionColor={colors.neutral[700]}
          className={`h-12 rounded-xl bg-surface-tertiary pr-3 text-[14px] leading-5 text-primary ${
            disabled ? "opacity-60" : "opacity-100"
          }`}
          style={{
            paddingLeft: variant === "sbtc-icon" ? 30 : 28,
            fontFamily: "InstrumentSans-Regular",
            borderWidth: 1,
            borderColor,
            elevation: 0,
          }}
        />
      </View>

      {errorText ? (
        <Text className="mt-1 pl-2 font-instrument-sans-medium text-xs leading-4 text-red-500">
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}
