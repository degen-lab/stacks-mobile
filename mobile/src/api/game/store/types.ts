import type { PurchaseType } from "@/lib/enums";
import { ItemType, ItemVariant } from "@/lib/enums";

export type StorePurchaseRequest = {
  itemType: ItemType;
  quantity?: number;
  metadata: {
    variant: ItemVariant;
  };
};

export type StoreItem = {
  itemType: number; // 0 = Power-Up, 1 = Skin
  variant: ItemVariant;
  name: string;
  description?: string;
  category: "consumable" | "unique";
  price: number;
};

export type StoreItemsResponse = {
  success: boolean;
  message: string;
  data: {
    items: StoreItem[];
  };
};

export type StorePurchasedItem = {
  id: number;
  type: number; // Backend returns 0 (Power-Up) or 1 (Skin)
  name: string;
  description?: string;
  purchaseType: PurchaseType;
  metadata?: Record<string, unknown>;
  // For consumable items:
  quantity?: number;
  pointsPerUnit?: number;
  // For unique items:
  pointsSpent?: number;
  createdAt: string;
};

export type StorePurchaseResponse = {
  success: boolean;
  message: string;
  data: {
    points: number;
    items: StorePurchasedItem[];
  };
};

/**
 * Helper to extract variant from metadata
 */
export function getItemVariant(item: StorePurchasedItem): string | undefined {
  return item.metadata?.variant as string | undefined;
}

/**
 * Maps backend numeric type to frontend ItemType enum
 */
export function mapNumericTypeToItemType(type: number): ItemType {
  switch (type) {
    case 0:
      return ItemType.PowerUp;
    case 1:
      return ItemType.Skin;
    default:
      throw new Error(`Unknown numeric ItemType: ${type}`);
  }
}
