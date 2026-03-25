import { Skeleton, View } from "@/components/ui";

export function ActivityItemSkeleton() {
  return (
    <View className="rounded-xl bg-surface-primary p-4 gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <View className="gap-1.5">
            <Skeleton className="h-4 w-20 rounded-sm" />
            <Skeleton className="h-3 w-14 rounded-sm" />
          </View>
        </View>
        <Skeleton className="h-4 w-24 rounded-sm" />
      </View>
      <Skeleton className="h-px w-full rounded-full" />
      <View className="flex-row items-center justify-between">
        <Skeleton className="h-3 w-16 rounded-sm" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </View>
    </View>
  );
}

export function ActivityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ActivityItemSkeleton key={i} />
      ))}
    </View>
  );
}
