import { InfoBadge, Text, View } from "@/components/ui";
import type { ItemVariant } from "@/lib/enums";
import PowerUpCard from "./power-up-card";
import type { PowerUp } from "./utils";

type PowerUpsLayoutProps = {
  powerUps: PowerUp[];
  ownedQuantities: Map<ItemVariant, number>;
  points: number | null;
  isPointsLoading: boolean;
  onPurchase: (variant: ItemVariant) => void;
  purchaseError?: string | null;
  pendingVariant?: ItemVariant | null;
  isPurchasing?: boolean;
};

export function PowerUpsLayout({
  powerUps,
  ownedQuantities,
  points,
  isPointsLoading,
  onPurchase,
  purchaseError,
  pendingVariant,
  isPurchasing,
}: PowerUpsLayoutProps) {
  return (
    <View className="flex-1 px-6 pb-8" testID="power-ups-layout">
      <View className="flex flex-row items-center justify-between mb-6">
        <Text className="text-3xl font-matter text-primary mb-3">
          Power-ups
        </Text>
        <InfoBadge label="Points" value={points} loading={isPointsLoading} />
      </View>

      <View className="gap-4 mt-2">
        {powerUps.map((powerUp) => {
          const ownedQuantity = ownedQuantities.get(powerUp.variant) ?? 0;
          const isPending = Boolean(
            isPurchasing && pendingVariant === powerUp.variant,
          );

          return (
            <PowerUpCard
              key={powerUp.variant}
              powerUp={powerUp}
              ownedQuantity={ownedQuantity}
              points={points}
              onPurchase={onPurchase}
              isPending={isPending}
            />
          );
        })}
      </View>

      {purchaseError ? (
        <Text
          className="text-center text-sm font-instrument-sans text-red-600"
          testID="power-ups-error"
        >
          {purchaseError}
        </Text>
      ) : null}
    </View>
  );
}
