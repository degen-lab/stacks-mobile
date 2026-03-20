import { Skeleton, View } from "@/components/ui";

export function ReclaimSkeleton() {
  return (
    <View className="gap-4">
      <View className="rounded-xl bg-surface-primary p-4 gap-3">
        <Skeleton className="h-4 w-32 rounded-sm" />
        <Skeleton className="h-4 w-48 rounded-sm" />
        <Skeleton className="h-4 w-28 rounded-sm" />
      </View>
      <Skeleton className="h-14 w-full rounded-xl" />
    </View>
  );
}
