import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function PortfolioPerformanceCardSkeleton() {
  return (
    <View className="border-border-secondary rounded-xl border bg-transparent">
      {/* Header skeleton */}
      <View className="px-5 pt-5 pb-4 gap-4">
        <View className="gap-2">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-10 w-28 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
        </View>
        <View className="gap-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </View>
      </View>

      {/* Controls skeleton */}
      <View className="px-5 pb-5 gap-5">
        <View className="flex-row items-center justify-between">
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-7 w-28 rounded" />
        </View>

        {/* Legend skeleton */}
        <View className="flex-row gap-4">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </View>

        {/* Chart skeleton */}
        <Skeleton className="h-72 w-full rounded-lg" />

        {/* Earnings skeleton */}
        <Skeleton className="h-20 w-full rounded-lg" />
      </View>
    </View>
  );
}
