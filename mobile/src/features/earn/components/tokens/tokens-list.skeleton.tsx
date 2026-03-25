import { Skeleton, View } from "@/components/ui";

export function TokensListSkeleton() {
  return (
    <View
      testID="tokens-list-skeleton"
      className="overflow-hidden rounded-[20px] border border-surface-secondary bg-sand-50"
    >
      {[0, 1, 2].map((index) => (
        <View key={index}>
          <View className="flex-row items-center justify-between gap-3 px-3 py-3.5">
            <View className="flex-1 flex-row items-center gap-3.5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <View className="flex-1 gap-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </View>
            </View>
            <View className="items-end gap-1.5">
              <Skeleton className="h-4 w-14 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
