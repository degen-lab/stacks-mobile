import { ConsumableItem } from '../entities/consumableItem';
import { ItemVariant, PurchaseType } from '../entities/enums';
import { UniqueItem } from '../entities/uniqueItem';
import { ItemNotFoundError } from '../errors/gameStoreErrors';
import { storeItems } from '../helpers/gameStoreItems';
import { StoreItem } from '../helpers/types';

export class GameStoreDomainService {
  createConsumableItem(
    variant: ItemVariant,
    purchaseType: PurchaseType,
    quantity: number,
  ): ConsumableItem {
    const itemData = storeItems[variant];
    if (!itemData) {
      throw new ItemNotFoundError(`Item ${variant} not found`);
    }
    const consumableItem = new ConsumableItem();
    consumableItem.name = itemData.name;
    consumableItem.type = itemData.itemType;
    consumableItem.description = itemData.description;
    consumableItem.purchaseType = purchaseType;
    consumableItem.quantity = quantity;
    consumableItem.pointsPerUnit =
      purchaseType === PurchaseType.Points ? itemData.price : 0;
    consumableItem.metadata = { variant: itemData.variant };
    return consumableItem;
  }

  createUniqueItem(
    variant: ItemVariant,
    purchaseType: PurchaseType,
  ): UniqueItem {
    const itemData = storeItems[variant];
    if (!itemData) {
      throw new ItemNotFoundError();
    }
    const uniqueItem = new UniqueItem();
    uniqueItem.name = itemData.name;
    uniqueItem.type = itemData.itemType;
    uniqueItem.description = itemData.description;
    uniqueItem.purchaseType = purchaseType;
    uniqueItem.pointsSpent =
      purchaseType === PurchaseType.Points ? itemData.price : 0;
    uniqueItem.metadata = { variant: itemData.variant };
    return uniqueItem;
  }

  getItemData(variant: ItemVariant): StoreItem {
    const itemData = storeItems[variant];
    if (!itemData) {
      throw new ItemNotFoundError(`Item ${variant} not found`);
    }
    return itemData;
  }
}
