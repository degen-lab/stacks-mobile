import { queryClient } from "@/api/common/api-provider";
import { useStoreItems, useStorePurchaseMutation } from "@/api/store";
import type { UserProfile } from "@/api/user/types";
import { useUserProfile } from "@/api/user";
import { ItemType, ItemVariant } from "@/lib/enums";
import { useMemo, useState } from "react";
import { PowerUpsLayout } from "./power-ups.layout";
import {
  buildItemQuantities,
  buildPowerUps,
  mergePurchasedItems,
} from "./utils";

export default function PowerUpsContainer() {
  const { data: userProfile } = useUserProfile();
  const purchaseMutation = useStorePurchaseMutation();
  const { data: storeItems } = useStoreItems();
  const [error, setError] = useState<string | null>(null);
  const [pendingVariant, setPendingVariant] = useState<ItemVariant | null>(
    null,
  );

  const itemQuantities = useMemo(
    () => buildItemQuantities(userProfile?.items),
    [userProfile?.items],
  );

  const powerUps = useMemo(() => buildPowerUps(storeItems), [storeItems]);

  const handlePurchase = async (variant: ItemVariant) => {
    setError(null);
    setPendingVariant(variant);
    try {
      const response = await purchaseMutation.mutateAsync({
        itemType: ItemType.PowerUp,
        quantity: 1,
        metadata: {
          variant,
        },
      });

      queryClient.setQueryData<UserProfile>(["user-profile"], (prev) => {
        if (!prev) return prev;
        const purchasedItems = response?.data?.items ?? [];
        const nextItems = mergePurchasedItems(prev.items ?? [], purchasedItems);
        const nextPoints =
          typeof response?.data?.points === "number"
            ? response.data.points
            : prev.points;
        return {
          ...prev,
          items: nextItems,
          points: nextPoints,
        };
      });

      if (!response?.data?.items?.length) {
        await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      }
    } catch (purchaseError) {
      console.error("Failed to purchase item", purchaseError);
      setError("Unable to complete purchase. Please try again.");
    } finally {
      setPendingVariant(null);
    }
  };

  return (
    <PowerUpsLayout
      powerUps={powerUps}
      ownedQuantities={itemQuantities}
      points={userProfile?.points ?? null}
      isPointsLoading={userProfile === undefined}
      onPurchase={handlePurchase}
      purchaseError={error}
      pendingVariant={pendingVariant}
      isPurchasing={purchaseMutation.isPending}
    />
  );
}
