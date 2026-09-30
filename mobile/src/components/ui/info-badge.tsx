import { ReactNode, useMemo } from "react";
import { View } from "react-native";

import { Text } from "./text";
import { Skeleton } from "./skeleton";

type InfoBadgeProps = {
  icon?: ReactNode;
  label?: string;
  value: number | string | null;
  loading?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  containerClassName?: string;
};

export function InfoBadge({
  icon,
  label,
  value,
  loading = false,
  labelClassName = "text-secondary",
  valueClassName = "text-primary",
  containerClassName = "",
}: InfoBadgeProps) {
  const displayValue = useMemo(() => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      try {
        return value.toLocaleString();
      } catch {
        return String(value);
      }
    }
    return value;
  }, [value]);

  const hasLabel = Boolean(label?.trim());
  const hasIcon = Boolean(icon);
  const gapClass =
    hasIcon && hasLabel ? "gap-1.5" : hasIcon || hasLabel ? "gap-1" : "";

  if (loading) {
    return (
      <View
        pointerEvents="none"
        className={`flex-row items-center ${gapClass} rounded-lg border-2 border-sand-300 bg-transparent px-3 py-1.5 ${containerClassName}`}
      >
        <Skeleton className="h-4 w-20 rounded" />
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      className={`flex-row items-center ${gapClass} rounded-lg border-2 border-surface-secondary bg-transparent px-3 py-1.5 ${containerClassName}`}
    >
      {icon}
      {hasLabel ? (
        <Text
          className={`font-instrument-sans text-sm ${labelClassName}`}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}
      <Text
        className={`font-instrument-sans text-sm ${valueClassName}`}
        numberOfLines={1}
      >
        {displayValue}
      </Text>
    </View>
  );
}
