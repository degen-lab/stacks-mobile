import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function RewardsCycleCardSkeleton() {
  return (
    <View className="border-border-secondary rounded-xl border bg-sand-100 pt-3 pb-6">
      <View className="flex-row items-end justify-between px-3 pt-2">
        <Skeleton className="h-5 w-36 rounded-sm" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </View>

      <View className="px-3 pt-4">
        <Skeleton className="h-8 w-20 rounded-sm" />

        <View className="mt-6 gap-2">
          <Skeleton className="h-4 w-20 rounded-sm" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-4 w-40 rounded-sm" />
        </View>

        <View className="mt-6 gap-6">
          <Skeleton className="h-10 w-full rounded-sm" />
          <Skeleton className="h-10 w-full rounded-sm" />
        </View>

        <Skeleton className="mt-6 h-4 w-36 rounded-sm" />
      </View>
    </View>
  );
}
