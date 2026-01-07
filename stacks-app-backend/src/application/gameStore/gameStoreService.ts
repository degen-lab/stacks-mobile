import { EntityManager } from 'typeorm';
import { GameStoreDomainService } from '../../domain/service/gameStoreDomainService';
import {
  ItemCategory,
  ItemType,
  ItemVariant,
  PurchaseType,
} from '../../domain/entities/enums';
import { User } from '../../domain/entities/user';
import { UserNotFoundError } from '../errors/userErrors';
import {
  InvalidItemVariantError,
  QuantityNotProvidedError,
} from '../../domain/errors/gameStoreErrors';
import { storeItems } from '../../domain/helpers/gameStoreItems';

export class GameStoreService {
  constructor(
    private gameStoreDomainService: GameStoreDomainService,
    private entityManager: EntityManager,
  ) {}

  getAvailableItems() {
    const items = Object.entries(storeItems).map(([itemType, itemData]) => {
      const variant = itemType as ItemVariant;
      return {
        itemType: itemData.itemType,
        variant,
        name: itemData.name,
        description: itemData.description,
        category: itemData.category,
        price: itemData.price,
      };
    });

    return items;
  }

  async purchaseItem(
    userId: number,
    itemType: ItemType,
    variant: ItemVariant,
    quantity?: number,
  ) {
    return await this.entityManager.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        relations: ['items'],
      });
      if (!user) {
        throw new UserNotFoundError(
          `Invalid id, user with id ${userId} not found`,
        );
      }

      const itemData = this.gameStoreDomainService.getItemData(variant);
      if (itemData.itemType !== itemType) {
        throw new InvalidItemVariantError();
      }

      if (itemData.category === ItemCategory.consumable) {
        if (!quantity || quantity < 1) {
          throw new QuantityNotProvidedError();
        }
        const purchasedItem = this.gameStoreDomainService.createConsumableItem(
          variant,
          PurchaseType.Points,
          quantity,
        );
        purchasedItem.user = user;
        user.purchaseConsumableItem(purchasedItem);
      } else {
        const purchasedItem = this.gameStoreDomainService.createUniqueItem(
          variant,
          PurchaseType.Points,
        );
        purchasedItem.user = user;
        user.purchaseUniqueItem(purchasedItem);
      }
      const updatedUser = await manager.save(user);
      return {
        points: updatedUser.points,
        items: updatedUser.items,
      };
    });
  }
}
