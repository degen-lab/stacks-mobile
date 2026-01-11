import { useCallback } from "react";

import { queryClient } from "@/api/common/api-provider";
import type { UserProfile } from "@/api/user/types";
import { getItemVariant } from "@/api/user/types";
import { ItemVariant } from "@/lib/enums";

interface IPowerUpInventory {
  canUseDropPoint: boolean;
  canUseRevive: boolean;
  onConsumeDropPoint: () => void;
  onConsumeRevive: () => void;
  registerUsedItem: (variant: ItemVariant) => void;
}

export const usePowerUpInventory = ({
  canUseDropPoint,
  canUseRevive,
  onConsumeDropPoint,
  onConsumeRevive,
  registerUsedItem,
}: IPowerUpInventory) => {
  const consumeItem = useCallback((variant: ItemVariant) => {
    queryClient.setQueryData<UserProfile>(["user-profile"], (prev) => {
      if (!prev?.items?.length) return prev;
      let consumed = false;
      const nextItems = prev.items.map((item) => {
        if (consumed) return item;
        if (getItemVariant(item) !== variant) return item;
        const currentQuantity = item.quantity ?? 1;
        if (currentQuantity <= 0) return item;
        consumed = true;
        return {
          ...item,
          quantity: Math.max(0, currentQuantity - 1),
        };
      });
      return {
        ...prev,
        items: nextItems,
      };
    });
  }, []);

  const consumeDropPoint = useCallback(() => {
    if (!canUseDropPoint) return;
    registerUsedItem(ItemVariant.DropPoint);
    onConsumeDropPoint();
    consumeItem(ItemVariant.DropPoint);
  }, [canUseDropPoint, consumeItem, onConsumeDropPoint, registerUsedItem]);

  const consumeRevive = useCallback(() => {
    if (!canUseRevive) return;
    registerUsedItem(ItemVariant.Revive);
    onConsumeRevive();
    consumeItem(ItemVariant.Revive);
  }, [canUseRevive, consumeItem, onConsumeRevive, registerUsedItem]);

  return {
    consumeDropPoint,
    consumeRevive,
  };
};
