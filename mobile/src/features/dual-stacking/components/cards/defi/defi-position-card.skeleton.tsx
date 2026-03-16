import { View } from "@/components/ui";
import { Card } from "../shared/card";
import { CardHeaderSkeleton } from "../shared/card-header.skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function PositionCardSkeleton() {
  return (
    <Card>
      <CardHeaderSkeleton showTooltipIcon />
      <View className="mt-3 flex-row items-center gap-2.5">
        <Skeleton className="size-7 scale-120 rounded-lg" />
        <View className="flex flex-row items-end gap-2">
          <Skeleton className="h-7 w-20 rounded-sm" />
          <Skeleton className="h-5 w-28 rounded-sm" />
        </View>
      </View>
    </Card>
  );
}
