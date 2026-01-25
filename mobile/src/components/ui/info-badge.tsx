import { ReactNode, useMemo } from "react";

import { Text, View } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";

type InfoBadgeProps = {
  icon?: ReactNode;
  label: string;
  value: number | string | null;
  loading?: boolean;
};

export function InfoBadge({
  icon,
  label,
  value,
  loading = false,
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

  const gapClass = icon ? "gap-1.5" : "gap-1";

  if (loading) {
    return (
      <View
        className={`flex-row items-center ${gapClass} rounded-lg border-2 border-sand-300 bg-transparent px-3 py-1.5`}
      >
        <Skeleton className="h-4 w-20 rounded" />
      </View>
    );
  }

  return (
    <View
      className={`flex-row items-center ${gapClass} rounded-lg border-2 border-surface-secondary bg-transparent px-3 py-1.5`}
    >
      {icon}
      <Text className="font-instrument-sans text-sm text-secondary">
        {label}
      </Text>
      <Text className="font-instrument-sans text-sm text-primary">
        {displayValue}
      </Text>
    </View>
  );
}
