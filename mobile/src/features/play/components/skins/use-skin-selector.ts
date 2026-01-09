import { queryClient } from "@/api/common/api-provider";
import { useStorePurchaseMutation } from "@/api/store";
import { useUserProfile } from "@/api/user";
import { getItemVariant, UserItem } from "@/api/user/types";
import { ItemType } from "@/lib/enums";
import { useGameStore } from "@/lib/store/game";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SKIN_ID,
  SKIN_ASSETS,
  SKIN_ID_TO_VARIANT,
  SKIN_VARIANT_TO_ID,
  type SkinId,
} from "./skin-config";

export function useSkinSelector(availablePoints: number = 0) {
  const {
    selectedSkinId,
    setSelectedSkinId,
    hydrateSelectedSkin,
    hasHydratedSelectedSkin,
  } = useGameStore();
  const { data: userProfile } = useUserProfile();
  const purchaseMutation = useStorePurchaseMutation();
  const [error, setError] = useState<string | null>(null);

  // Check which skins are owned from user profile
  const ownedSkins = useMemo(() => {
    const owned = new Set<SkinId>();
    if (!userProfile?.items) return owned;

    userProfile.items.forEach((item: UserItem) => {
      const variant = getItemVariant(item);
      const skinId =
        SKIN_VARIANT_TO_ID[variant as keyof typeof SKIN_VARIANT_TO_ID];
      if (skinId) owned.add(skinId);
    });

    return owned;
  }, [userProfile?.items]);

  const isSkinOwned = useCallback(
    (skinId: SkinId) => {
      return skinId === DEFAULT_SKIN_ID || ownedSkins.has(skinId);
    },
    [ownedSkins],
  );

  useEffect(() => {
    void hydrateSelectedSkin();
  }, [hydrateSelectedSkin]);

  useEffect(() => {
    if (!hasHydratedSelectedSkin) return;
    if (isSkinOwned(selectedSkinId)) return;
    const ownedSkin = SKIN_ASSETS.find(
      (skin) => skin.id !== DEFAULT_SKIN_ID && ownedSkins.has(skin.id),
    );
    if (ownedSkin) {
      setSelectedSkinId(ownedSkin.id);
      return;
    }
    if (selectedSkinId !== DEFAULT_SKIN_ID) {
      setSelectedSkinId(DEFAULT_SKIN_ID);
    }
  }, [
    hasHydratedSelectedSkin,
    isSkinOwned,
    ownedSkins,
    selectedSkinId,
    setSelectedSkinId,
  ]);

  const handlePurchaseSkin = async (skinId: SkinId, cost: number) => {
    if (isSkinOwned(skinId) || cost === 0) {
      setSelectedSkinId(skinId);
      return;
    }

    if (availablePoints < cost) {
      setError("Not enough points");
      return;
    }

    setError(null);
    try {
      const variant = SKIN_ID_TO_VARIANT[skinId as Exclude<SkinId, "orange">];
      if (!variant) {
        setError("Invalid skin variant");
        return;
      }
      await purchaseMutation.mutateAsync({
        itemType: ItemType.Skin,
        metadata: {
          variant,
        },
      });
      // Invalidate profile query to refresh owned items
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setSelectedSkinId(skinId);
    } catch (purchaseError) {
      console.error("Failed to purchase skin", purchaseError);
      setError("Unable to complete purchase. Please try again.");
    }
  };

  return {
    selectedSkinId,
    ownedSkins,
    isSkinOwned,
    handlePurchaseSkin,
    error,
    isPurchasing: purchaseMutation.isPending,
  };
}
