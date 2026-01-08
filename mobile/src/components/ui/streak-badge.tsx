import { useMemo } from "react";

import { Text, View } from "@/components/ui";
import { StreakIcon } from "@/components/ui/icons/streak";
import { Skeleton } from "@/components/ui/skeleton";

type StreakBadgeProps = {
  streak: number | null;
  loading?: boolean;
};

export function StreakBadge({ streak, loading = false }: StreakBadgeProps) {
  const displayValue = useMemo(() => {
    if (streak === null || streak === undefined) return "—";
    try {
      return streak.toLocaleString();
    } catch {
      return String(streak);
    }
  }, [streak]);

  if (loading) {
    return (
      <View className="flex-row items-center gap-2 rounded-lg border-2 border-sand-300 bg-transparent px-3 py-1.5">
        <Skeleton className="h-4 w-20 rounded" />
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1.5 rounded-lg border-2 border-surface-secondary bg-transparent px-3 py-1.5">
      <StreakIcon size={16} />
      <Text className="font-instrument-sans text-sm text-secondary">
        Streak
      </Text>
      <Text className="font-instrument-sans text-sm text-primary">
        {displayValue}
      </Text>
    </View>
  );
}
