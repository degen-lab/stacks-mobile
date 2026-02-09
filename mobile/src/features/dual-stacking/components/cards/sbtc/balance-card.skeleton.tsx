import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "../shared/card";
import { CardHeaderSkeleton } from "../shared/card-header.skeleton";
import { View } from "@/components/ui";

export function BalanceCardSkeleton() {
  return (
    <Card>
      <CardHeaderSkeleton showStatusBadge />
      <View className="mt-3 flex-row items-center gap-2">
        <Skeleton className="size-7 scale-120 rounded-lg" />
        <View className="space-y-2">
          <Skeleton className="h-7 w-24 rounded-sm" />
        </View>
      </View>
    </Card>
  );
}
