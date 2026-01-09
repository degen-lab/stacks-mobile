import { Button, Text, View } from "@/components/ui";
import type { ItemVariant } from "@/lib/enums";
import type { PowerUp } from "./utils";

type PowerUpCardProps = {
  powerUp: PowerUp;
  ownedQuantity: number;
  points: number | null;
  onPurchase: (variant: ItemVariant) => void;
  isPending: boolean;
};

export default function PowerUpCard({
  powerUp,
  ownedQuantity,
  points,
  onPurchase,
  isPending,
}: PowerUpCardProps) {
  const { variant, title, description, price, Icon } = powerUp;
  const hasPoints = points === null || points >= price;
  const missingPoints = points === null ? null : Math.max(price - points, 0);

  return (
    <View
      className="rounded-2xl border border-surface-secondary bg-white px-4 py-4"
      testID={`power-up-card-${variant}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-start gap-3 flex-1 pr-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sand-100 border border-sand-200">
            <Icon size={24} />
          </View>
          <View className="flex-1 w-full">
            <View className="flex-row items-center gap-2 justify-between">
              <Text
                className="text-lg font-matter text-primary"
                testID={`power-up-title-${variant}`}
              >
                {title}
              </Text>
              <View className="rounded-full bg-sand-100 px-2 py-0.5">
                <Text
                  className="text-sm font-instrument-sans text-secondary"
                  testID={`power-up-owned-${variant}`}
                >
                  Owned {ownedQuantity}
                </Text>
              </View>
            </View>
            <Text
              className="mt-1 text-sm font-instrument-sans text-secondary leading-5 max-w-40"
              testID={`power-up-description-${variant}`}
            >
              {description}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-2">
        <Button
          label={
            hasPoints || missingPoints === null
              ? `Buy for ${price}`
              : `Missing ${missingPoints} points`
          }
          size="default"
          className="h-11 px-6 rounded-full"
          disabled={!hasPoints}
          loading={isPending}
          onPress={() => onPurchase(variant)}
          testID={`power-up-action-${variant}`}
        />
      </View>
    </View>
  );
}
