import React from "react";
import { View } from "react-native";
import { Skeleton } from "@/components/ui";

export function StepRowSkeleton() {
  return (
    <View className="bg-sand-100 relative flex-row items-start gap-4 rounded-xl p-4">
      <Skeleton className="w-9 h-9 shrink-0 rounded-full" />

      <View className="flex-1 flex-col gap-2">
        <View className="flex-col items-start justify-between gap-4">
          <View className="flex-1 gap-2">
            <Skeleton className="h-5 w-24 rounded-sm" />
            <Skeleton className="h-6 w-36 rounded-sm" />
          </View>
          <Skeleton className="h-7 w-28 shrink-0 rounded-md" />
        </View>
      </View>
    </View>
  );
}
