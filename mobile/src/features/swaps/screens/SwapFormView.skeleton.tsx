import { ArrowUpDown } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { StyleSheet } from "react-native";

import { View, colors } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveThemeTokenColor } from "@/lib/theme/theme-tokens";

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const flipButtonStyle = {
    ...styles.flipButton,
    backgroundColor: isDark
      ? resolveThemeTokenColor("dark", "--color-surface-secondary")
      : "#EAE8E6",
    borderColor: isDark
      ? resolveThemeTokenColor("dark", "--color-border-primary")
      : "#D5D3D1",
  } as const;

  return (
    <>
      <View className="mb-4 overflow-hidden rounded-[20px] border border-border-secondary bg-sand-100 dark:border-border-primary dark:bg-surface-primary">
        <SwapSectionSkeleton hasAction />
        <View className="flex-row items-center px-4">
          <View className="h-px flex-1 bg-surface-secondary dark:bg-border-primary" />
          <View style={flipButtonStyle}>
            <ArrowUpDown
              size={14}
              color={isDark ? colors.charcoal[300] : colors.neutral[300]}
            />
          </View>
          <View className="h-px flex-1 bg-surface-secondary dark:bg-border-primary" />
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
