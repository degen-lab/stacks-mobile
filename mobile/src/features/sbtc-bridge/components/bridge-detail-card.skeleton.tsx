import { Skeleton, View } from "@/components/ui";

/**
 * Shared skeleton for deposit and withdrawal detail screens.
 * Mirrors: BridgeRouteCard → amount field → address field → chips
 */
export function BridgeDetailCardSkeleton() {
  return (
    <View className="rounded-xl bg-surface-primary overflow-hidden">
      {/* Route card */}
      <Skeleton className="h-14 w-full rounded-none" />

      <View className="p-4 gap-3 mt-1">
        {/* Amount field */}
        <View className="rounded-xl bg-surface-secondary p-4 gap-2">
          <Skeleton className="h-3 w-24 rounded-sm" />
          <Skeleton className="h-6 w-32 rounded-sm" />
        </View>

        {/* Address field */}
        <View className="rounded-xl bg-surface-secondary p-4 gap-2">
          <Skeleton className="h-3 w-28 rounded-sm" />
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-40 rounded-sm" />
          </View>
        </View>

        {/* Chips */}
        <View className="flex-row gap-2">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 flex-1 rounded-lg" />
        </View>
      </View>
    </View>
  );
}
