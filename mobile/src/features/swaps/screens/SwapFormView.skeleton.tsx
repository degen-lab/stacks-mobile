import { ArrowUpDown } from "lucide-react-native";
import { StyleSheet } from "react-native";

import { View, colors } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";

function SwapSectionSkeleton({ hasAction }: { hasAction?: boolean }) {
  return (
    <View className="gap-3 px-4 py-5">
      <View
        className="flex-row items-center justify-between"
        style={{ minHeight: 28 }}
      >
        <Skeleton className="h-4 w-24 rounded" />
        {hasAction && <Skeleton className="h-7 w-12 rounded-lg" />}
      </View>
      <View className="flex-row items-center justify-between gap-4">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </View>
      <View className="flex-row items-center justify-between">
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-3.5 w-24 rounded" />
      </View>
    </View>
  );
}

export function SwapFormSkeleton() {
  return (
    <>
      <View className="overflow-hidden rounded-[20px] border border-border-secondary bg-sand-100 mb-4">
        <SwapSectionSkeleton hasAction />
        <View className="flex-row items-center px-4">
          <View className="h-px flex-1 bg-surface-secondary" />
          <View style={styles.flipButton}>
            <ArrowUpDown size={14} color={colors.neutral[300]} />
          </View>
          <View className="h-px flex-1 bg-surface-secondary" />
        </View>
        <SwapSectionSkeleton />
      </View>
      <Skeleton className="h-14 w-full rounded-2xl" />
    </>
  );
}

const styles = StyleSheet.create({
  flipButton: {
    height: 32,
    width: 32,
    borderRadius: 8,
    backgroundColor: "#EAE8E6",
    borderWidth: 2,
    borderColor: "#D5D3D1",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
});
