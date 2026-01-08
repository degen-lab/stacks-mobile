import { useMemo } from "react";

import { Text, View } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";

type PointsBadgeProps = {
  points: number | null;
  loading?: boolean;
};

export function PointsBadge({ points, loading = false }: PointsBadgeProps) {
  const displayValue = useMemo(() => {
    if (points === null || points === undefined) return "—";
    try {
      return points.toLocaleString();
    } catch {
      return String(points);
    }
  }, [points]);

  if (loading) {
    return (
      <View className="flex-row items-center gap-1 rounded-lg border-2 border-sand-300 bg-transparent px-3 py-1.5">
        <Skeleton className="h-4 w-20 rounded" />
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1 rounded-lg border-2 border-surface-secondary bg-transparent px-3 py-1.5">
      <Text className="font-instrument-sans text-sm text-secondary">
        Points
      </Text>
      <Text className="font-instrument-sans text-sm text-primary">
        {displayValue}
      </Text>
    </View>
  );
}
