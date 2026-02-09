import { Skeleton } from "@/components/ui/skeleton";
import { View } from "react-native";

interface CardHeaderSkeletonProps {
  showStatusBadge?: boolean;
  showTooltipIcon?: boolean;
}

export function CardHeaderSkeleton({
  showStatusBadge = false,
  showTooltipIcon = false,
}: CardHeaderSkeletonProps) {
  return (
    <View className="flex-row w-full items-center justify-between">
      <Skeleton className="h-4 w-32 rounded-sm" />
      <View className="flex items-center gap-2">
        {showStatusBadge && <Skeleton className="h-5 w-20 rounded-sm" />}
        {showTooltipIcon && <Skeleton className="h-5 w-5 rounded-full" />}
      </View>
    </View>
  );
}
