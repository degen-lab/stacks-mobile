import { Skeleton, View } from "@/components/ui";

import { ActivityListSkeleton } from "../../components/activity-card.skeleton";

export function BridgeActivitySkeleton() {
  return (
    <View className="gap-4">
      <View className="flex-row justify-between items-center">
        <Skeleton className="h-7 w-36 rounded-sm" />
        <Skeleton className="h-9 w-40 rounded-full" />
      </View>
      <ActivityListSkeleton count={4} />
    </View>
  );
}
