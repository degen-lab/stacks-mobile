import { Skeleton, View } from "@/components/ui";

function OverviewGridSkeleton() {
  return (
    <View className="gap-3">
      <Skeleton className="h-20 w-full rounded-xl" />
      <View className="flex-row gap-2">
        <Skeleton className="h-14 flex-1 rounded-xl" />
        <Skeleton className="h-14 flex-1 rounded-xl" />
      </View>
      <View className="flex-row gap-2">
        <Skeleton className="h-14 flex-1 rounded-xl" />
        <Skeleton className="h-14 flex-1 rounded-xl" />
      </View>
    </View>
  );
}

function BridgeCardSkeleton() {
  return (
    <View className="rounded-xl bg-surface-primary px-4 py-5 gap-4 mt-5">
      <Skeleton className="h-9 w-48 self-center rounded-full" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </View>
  );
}

export function BridgeHomeSkeleton() {
  return (
    <View className="gap-5">
      <OverviewGridSkeleton />
      <BridgeCardSkeleton />
    </View>
  );
}
