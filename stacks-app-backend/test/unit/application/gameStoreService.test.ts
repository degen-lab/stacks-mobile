import { GameStoreService } from '../../../src/application/gameStore/gameStoreService';
import { GameStoreDomainService } from '../../../src/domain/service/gameStoreDomainService';
import { EntityManager } from 'typeorm';
import { User } from '../../../src/domain/entities/user';
import { ConsumableItem } from '../../../src/domain/entities/consumableItem';
import { UniqueItem } from '../../../src/domain/entities/uniqueItem';
import { DefaultItem } from '../../../src/domain/entities/defaultItem';
import {
  ItemType,
  PurchaseType,
  ItemCategory,
  ItemVariant,
} from '../../../src/domain/entities/enums';
import { UserNotFoundError } from '../../../src/application/errors/userErrors';
import {
  QuantityNotProvidedError,
  InsufficientPointsError,
  ItemNotFoundError,
} from '../../../src/domain/errors/gameStoreErrors';

type PurchaseResult = {
  points: number;
  items: DefaultItem[];
};

describe('GameStoreService application class Unit tests', () => {
  let gameStoreService: GameStoreService;
  let mockGameStoreDomainService: jest.Mocked<GameStoreDomainService>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(() => {
    mockGameStoreDomainService = {
      getItemData: jest.fn(),
      createConsumableItem: jest.fn(),
      createUniqueItem: jest.fn(),
    } as unknown as jest.Mocked<GameStoreDomainService>;

    mockEntityManager = {
      transaction: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    gameStoreService = new GameStoreService(
      mockGameStoreDomainService,
      mockEntityManager,
    );
  });

  describe('purchaseItem', () => {
    describe('Consumable items', () => {
      it('should successfully purchase consumable item and deduct points', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [];

        const purchasedItem = new ConsumableItem();
        purchasedItem.type = ItemType.PowerUp;
        purchasedItem.quantity = 2;
        purchasedItem.pointsPerUnit = 100;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          purchasedItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.PowerUp,
          ItemVariant.Revive,
          2,
        );

        expect(result.points).toBe(300); // 500 - (100 * 2)
        expect(user.items.length).toBe(1);
        expect(user.items[0]).toBe(purchasedItem);
        expect(purchasedItem.user).toBe(user);
      });

      it('should merge quantities when user already owns consumable item', async () => {
        const userId = 1;
        const existingItem = new ConsumableItem();
        existingItem.id = 1;
        existingItem.type = ItemType.PowerUp;
        existingItem.quantity = 3;
        existingItem.pointsPerUnit = 100;
        existingItem.purchaseType = PurchaseType.Points;

        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [existingItem];

        const newItem = new ConsumableItem();
        newItem.type = ItemType.PowerUp;
        newItem.quantity = 2;
        newItem.pointsPerUnit = 100;
        newItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          newItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.PowerUp,
          ItemVariant.Revive,
          2,
        );

        expect(result.points).toBe(300); // 500 - (100 * 2)
        expect(user.items.length).toBe(1); // Should still be 1 item
        expect(existingItem.quantity).toBe(5); // 3 + 2
        expect(newItem.user).toBe(user);
      });

      it('should throw InsufficientPointsError when user does not have enough points', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 50; // Not enough for 2 items at 100 each
        user.items = [];

        const purchasedItem = new ConsumableItem();
        purchasedItem.type = ItemType.PowerUp;
        purchasedItem.quantity = 2;
        purchasedItem.pointsPerUnit = 100;
        purchasedItem.purchaseType = PurchaseType.Points;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          purchasedItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn(),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        await expect(
          gameStoreService.purchaseItem(
            userId,
            ItemType.PowerUp,
            ItemVariant.Revive,
            2,
          ),
        ).rejects.toThrow(InsufficientPointsError);

        expect(user.points).toBe(50); // Should not be deducted
      });

      it('should throw QuantityNotProvidedError when quantity is missing for consumable', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [];

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn(),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        await expect(
          gameStoreService.purchaseItem(
            userId,
            ItemType.PowerUp,
            ItemVariant.Revive,
          ),
        ).rejects.toThrow(QuantityNotProvidedError);

        await expect(
          gameStoreService.purchaseItem(
            userId,
            ItemType.PowerUp,
            ItemVariant.Revive,
            0,
          ),
        ).rejects.toThrow(QuantityNotProvidedError);

        await expect(
          gameStoreService.purchaseItem(
            userId,
            ItemType.PowerUp,
            ItemVariant.Revive,
            -1,
          ),
        ).rejects.toThrow(QuantityNotProvidedError);
      });

      it('should handle exact point balance correctly', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 200; // Exactly enough for 2 items
        user.items = [];

        const purchasedItem = new ConsumableItem();
        purchasedItem.type = ItemType.PowerUp;
        purchasedItem.quantity = 2;
        purchasedItem.pointsPerUnit = 100;
        purchasedItem.purchaseType = PurchaseType.Points;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          purchasedItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.PowerUp,
          ItemVariant.Revive,
          2,
        );

        expect(result.points).toBe(0);
      });
    });

    describe('Unique items', () => {
      it('should successfully purchase unique item and deduct points', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [];

        const purchasedItem = new UniqueItem();
        purchasedItem.type = ItemType.Skin;
        purchasedItem.pointsSpent = 100;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.Skin,
          variant: ItemVariant.PurpleSkin,
          category: ItemCategory.unique,
          name: 'Skin',
          description: 'A skin',
          price: 100,
        });
        mockGameStoreDomainService.createUniqueItem.mockReturnValue(
          purchasedItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.Skin,
          ItemVariant.PurpleSkin,
        );

        expect(result.points).toBe(400); // 500 - 100
        expect(user.items.length).toBe(1);
        expect(user.items[0]).toBe(purchasedItem);
        expect(purchasedItem.user).toBe(user);
      });

      it('should allow purchasing multiple unique items of the same type', async () => {
        const userId = 1;
        const existingSkin = new UniqueItem();
        existingSkin.id = 1;
        existingSkin.type = ItemType.Skin;
        existingSkin.pointsSpent = 100;
        existingSkin.purchaseType = PurchaseType.Points;

        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [existingSkin];

        const newSkin = new UniqueItem();
        newSkin.type = ItemType.Skin;
        newSkin.pointsSpent = 100;
        newSkin.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.Skin,
          variant: ItemVariant.PurpleSkin,
          category: ItemCategory.unique,
          name: 'Skin',
          description: 'A skin',
          price: 100,
        });
        mockGameStoreDomainService.createUniqueItem.mockReturnValue(newSkin);

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.Skin,
          ItemVariant.PurpleSkin,
        );

        expect(result.points).toBe(400); // 500 - 100
        expect(user.items.length).toBe(2); // Should have 2 skins
        expect(user.items).toContain(existingSkin);
        expect(user.items).toContain(newSkin);
        expect(newSkin.user).toBe(user);
      });

      it('should throw InsufficientPointsError when user does not have enough points for unique item', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 50; // Not enough for 100 point skin
        user.items = [];

        const purchasedItem = new UniqueItem();
        purchasedItem.type = ItemType.Skin;
        purchasedItem.pointsSpent = 100;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.Skin,
          variant: ItemVariant.PurpleSkin,
          category: ItemCategory.unique,
          name: 'Skin',
          description: 'A skin',
          price: 100,
        });
        mockGameStoreDomainService.createUniqueItem.mockReturnValue(
          purchasedItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn(),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        await expect(
          gameStoreService.purchaseItem(
            userId,
            ItemType.Skin,
            ItemVariant.PurpleSkin,
          ),
        ).rejects.toThrow(InsufficientPointsError);

        expect(user.points).toBe(50); // Should not be deducted
        expect(user.items.length).toBe(0); // Should not add item
      });

      it('should ignore quantity parameter for unique items', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [];

        const purchasedItem = new UniqueItem();
        purchasedItem.type = ItemType.Skin;
        purchasedItem.pointsSpent = 100;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.Skin,
          variant: ItemVariant.PurpleSkin,
          category: ItemCategory.unique,
          name: 'Skin',
          description: 'A skin',
          price: 100,
        });
        mockGameStoreDomainService.createUniqueItem.mockReturnValue(
          purchasedItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        // Should work even if quantity is provided (should be ignored)
        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.Skin,
          ItemVariant.PurpleSkin,
          999, // Should be ignored
        );

        expect(result.points).toBe(400); // Only 100 deducted, not 999 * 100
        expect(user.items.length).toBe(1);
      });
    });

    describe('Error cases', () => {
      it('should throw UserNotFoundError when user does not exist', async () => {
        const userId = 999;

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(null),
              save: jest.fn(),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        await expect(
          gameStoreService.purchaseItem(
            userId,
            ItemType.PowerUp,
            ItemVariant.Revive,
            1,
          ),
        ).rejects.toThrow(UserNotFoundError);
      });

      it('should throw ItemNotFoundError when item type does not exist', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [];

        mockGameStoreDomainService.getItemData.mockImplementation(() => {
          throw new ItemNotFoundError('Item not found');
        });

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn(),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        await expect(
          gameStoreService.purchaseItem(
            userId,
            ItemType.PowerUp,
            ItemVariant.Revive,
            1,
          ),
        ).rejects.toThrow(ItemNotFoundError);

        expect(user.points).toBe(500); // Should not be deducted
      });
    });

    describe('Transaction behavior', () => {
      it('should rollback transaction if save fails', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [];

        const purchasedItem = new ConsumableItem();
        purchasedItem.type = ItemType.PowerUp;
        purchasedItem.quantity = 2;
        purchasedItem.pointsPerUnit = 100;
        purchasedItem.purchaseType = PurchaseType.Points;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          purchasedItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockRejectedValue(new Error('Database error')),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        await expect(
          gameStoreService.purchaseItem(
            userId,
            ItemType.PowerUp,
            ItemVariant.Revive,
            2,
          ),
        ).rejects.toThrow('Database error');

        // Transaction should rollback, but we can't verify that in unit test
        // In real scenario, points would be restored
      });

      it('should use transaction manager for all database operations', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [];

        const purchasedItem = new ConsumableItem();
        purchasedItem.type = ItemType.PowerUp;
        purchasedItem.quantity = 1;
        purchasedItem.pointsPerUnit = 100;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          purchasedItem,
        );

        const mockManager = {
          findOne: jest.fn().mockResolvedValue(user),
          save: jest.fn().mockResolvedValue(user),
        } as unknown as EntityManager;

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            return await callback(mockManager);
          },
        );

        await gameStoreService.purchaseItem(
          userId,
          ItemType.PowerUp,
          ItemVariant.Revive,
          1,
        );

        expect(mockManager.findOne).toHaveBeenCalledWith(User, {
          where: { id: userId },
          relations: ['items'],
        });
        expect(mockManager.save).toHaveBeenCalledWith(user);
      });
    });

    describe('Return value', () => {
      it('should return updated points and items after purchase', async () => {
        const userId = 1;
        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [];

        const purchasedItem = new ConsumableItem();
        purchasedItem.type = ItemType.PowerUp;
        purchasedItem.quantity = 1;
        purchasedItem.pointsPerUnit = 100;
        purchasedItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          purchasedItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.PowerUp,
          ItemVariant.Revive,
          1,
        );

        expect(result).toHaveProperty('points');
        expect(result).toHaveProperty('items');
        expect(result.points).toBe(400);
        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items.length).toBe(1);
      });
    });

    describe('Edge cases', () => {
      it('should handle user with existing items of different types', async () => {
        const userId = 1;
        const existingConsumable = new ConsumableItem();
        existingConsumable.id = 1;
        existingConsumable.type = ItemType.PowerUp;
        existingConsumable.quantity = 5;
        existingConsumable.pointsPerUnit = 100;
        existingConsumable.purchaseType = PurchaseType.Points;

        const existingUnique = new UniqueItem();
        existingUnique.id = 2;
        existingUnique.type = ItemType.Skin;
        existingUnique.pointsSpent = 100;
        existingUnique.purchaseType = PurchaseType.Points;

        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [existingConsumable, existingUnique];

        const newItem = new ConsumableItem();
        newItem.type = ItemType.PowerUp;
        newItem.quantity = 2;
        newItem.pointsPerUnit = 100;
        newItem.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          newItem,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.PowerUp,
          ItemVariant.Revive,
          2,
        );

        expect(result.points).toBe(300);
        expect(user.items.length).toBe(2); // Still 2 items (consumable merged, unique separate)
        expect(existingConsumable.quantity).toBe(7); // 5 + 2
      });

      it('should correctly identify consumable vs unique when finding existing items', async () => {
        const userId = 1;
        // User has a unique item of type Power-Up (shouldn't happen in real scenario, but test edge case)
        const existingUnique = new UniqueItem();
        existingUnique.id = 1;
        existingUnique.type = ItemType.PowerUp;
        existingUnique.pointsSpent = 100;
        existingUnique.purchaseType = PurchaseType.Points;

        const user = new User();
        user.id = userId;
        user.points = 500;
        user.items = [existingUnique];

        const newConsumable = new ConsumableItem();
        newConsumable.type = ItemType.PowerUp;
        newConsumable.quantity = 2;
        newConsumable.pointsPerUnit = 100;
        newConsumable.purchaseType = PurchaseType.Points;

        mockGameStoreDomainService.getItemData.mockReturnValue({
          itemType: ItemType.PowerUp,
          variant: ItemVariant.Revive,
          category: ItemCategory.consumable,
          name: 'Power Up',
          description: 'A power up',
          price: 100,
        });
        mockGameStoreDomainService.createConsumableItem.mockReturnValue(
          newConsumable,
        );

        (mockEntityManager.transaction as jest.Mock).mockImplementation(
          async (
            callback: (manager: EntityManager) => Promise<PurchaseResult>,
          ) => {
            const mockManager = {
              findOne: jest.fn().mockResolvedValue(user),
              save: jest.fn().mockImplementation(async (entity) => {
                // Return the modified entity (user is modified in place)
                return entity;
              }),
            } as unknown as EntityManager;
            return await callback(mockManager);
          },
        );

        const result = await gameStoreService.purchaseItem(
          userId,
          ItemType.PowerUp,
          ItemVariant.Revive,
          2,
        );

        // Should create new consumable item, not merge with unique item
        expect(result.points).toBe(300);
        expect(user.items.length).toBe(2); // Both items should exist
        expect(user.items).toContain(existingUnique);
        expect(user.items).toContain(newConsumable);
      });
    });
  });
});
