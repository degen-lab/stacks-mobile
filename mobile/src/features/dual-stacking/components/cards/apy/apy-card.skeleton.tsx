import { View } from "@/components/ui";
import { Card } from "../shared/card";
import { CardHeaderSkeleton } from "../shared/card-header.skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function APYCardSkeleton() {
  return (
    <Card>
      <CardHeaderSkeleton showStatusBadge />
      <View className="mt-3.5 space-y-3">
        <View className="flex flex-row items-baseline gap-2">
          <Skeleton className="h-6 w-20 rounded-sm" />
        </View>
        <Skeleton className="h-2 w-full rounded-sm" />
      </View>
    </Card>
  );
}
