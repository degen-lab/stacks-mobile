import type { StoreItem, StorePurchasedItem } from "@/api/store/types";
import { mapNumericTypeToItemType } from "@/api/store/types";
import type { UserItem } from "@/api/user/types";
import { getItemVariant } from "@/api/user/types";
import { HeartIcon } from "@/components/ui/icons/heart";
import { RulerIcon } from "@/components/ui/icons/ruler";
import { ItemType, ItemVariant } from "@/lib/enums";
import type React from "react";

type PowerUpIcon = React.ComponentType<{ size?: number }>;

export type PowerUp = {
  variant: ItemVariant;
  title: string;
  description: string;
  price: number;
  Icon: PowerUpIcon;
};

export const POWER_UPS: PowerUp[] = [
  {
    variant: ItemVariant.Revive,
    title: "Revive",
    description: "Revive and continue after a failed move.",
    price: 15,
    Icon: HeartIcon,
  },
  {
    variant: ItemVariant.DropPoint,
    title: "Drop Point",
    description: "Shows where the bridge will land before building it.",
    price: 15,
    Icon: RulerIcon,
  },
];

export const buildItemQuantities = (items?: UserItem[]) => {
  const quantities = new Map<ItemVariant, number>();
  if (!items) return quantities;
  items.forEach((item) => {
    const variant = getItemVariant(item);
    if (!variant) return;
    const current = quantities.get(variant) ?? 0;
    const quantity = item.quantity ?? 1;
    quantities.set(variant, current + quantity);
  });
  return quantities;
};

export const mergePurchasedItems = (
  current: UserItem[],
  purchased: StorePurchasedItem[],
) => {
  if (purchased.length === 0) return current;
  const byId = new Map<number, UserItem>();
  current.forEach((item) => byId.set(item.id, item));
  purchased.forEach((item) => byId.set(item.id, item));
  return Array.from(byId.values());
};

export const buildPowerUps = (storeItems?: StoreItem[]): PowerUp[] => {
  if (!storeItems?.length) return POWER_UPS;

  const storeByVariant = new Map<ItemVariant, StoreItem>();
  storeItems.forEach((item) => {
    if (mapNumericTypeToItemType(item.itemType) !== ItemType.PowerUp) return;
    storeByVariant.set(item.variant, item);
  });

  return POWER_UPS.map((powerUp) => {
    const storeItem = storeByVariant.get(powerUp.variant);
    if (!storeItem) return powerUp;
    return {
      ...powerUp,
      title: storeItem.name ?? powerUp.title,
      description: storeItem.description ?? powerUp.description,
      price: storeItem.price,
    };
  });
};
