import { Card } from "../shared/card";
import { CardHeaderSkeleton } from "../shared/card-header.skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { View } from "@/components/ui";

export function StackingCardSkeleton() {
  return (
    <Card>
      <CardHeaderSkeleton showTooltipIcon />
      <View className="mt-3 flex-col items-start gap-2.5">
        <View className="mb-2 flex gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-sm" />
        </View>

        <Skeleton className="h-5 w-40 rounded-sm" />
      </View>
    </Card>
  );
}
