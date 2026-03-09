import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function YieldCompositionCardSkeleton() {
  return (
    <View className="border-border-secondary rounded-xl border bg-surface-secondary pt-3 pb-6">
      <View className="flex-row items-end justify-between px-3 pt-2">
        <Skeleton className="h-5 w-36 rounded-sm" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </View>

      <View className="items-center gap-5 px-4 pt-5">
        <Skeleton className="h-40 w-40 rounded-full" />
        <View className="w-full gap-3">
          <Skeleton className="h-12 w-full rounded-sm" />
          <Skeleton className="h-12 w-full rounded-sm" />
          <Skeleton className="h-12 w-full rounded-sm" />
        </View>
      </View>
    </View>
  );
}
