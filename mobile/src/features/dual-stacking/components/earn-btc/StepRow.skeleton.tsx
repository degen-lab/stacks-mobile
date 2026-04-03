import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui";

export function StepRowSkeleton() {
  return (
    <View className="relative flex-row items-start gap-4 rounded-xl border border-border-secondary bg-sand-100 p-4 dark:border-border-primary dark:bg-surface-primary">
      <Skeleton className="w-9 h-9 shrink-0 rounded-full" />

      <View className="flex-1 gap-3">
        <View className="gap-2">
          <Skeleton className="h-5 w-24 rounded-sm" />
          <Skeleton className="h-6 w-36 rounded-sm" />
        </View>
        <Skeleton className="h-8 w-28 self-start rounded-full" />
      </View>
    </View>
  );
}
