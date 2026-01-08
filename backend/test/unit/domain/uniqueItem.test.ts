import { UniqueItem } from '../../../src/domain/entities/uniqueItem';
import { ItemType, PurchaseType } from '../../../src/domain/entities/enums';
import { User } from '../../../src/domain/entities/user';

describe('UniqueItem domain class Unit tests', () => {
  let testUniqueItem: UniqueItem;
  let testUser: User;

  beforeEach(() => {
    testUser = new User();
    testUser.googleId = 'mockedId';
    testUser.nickName = 'nick';
    testUser.referralCode = 'referralCode';
    testUser.points = 100;
    testUser.referees = [];
    testUser.submissions = [];
    testUser.items = [];

    testUniqueItem = new UniqueItem();
    testUniqueItem.name = 'Test Unique Item';
    testUniqueItem.type = ItemType.PowerUp;
    testUniqueItem.purchaseType = PurchaseType.Points;
    testUniqueItem.user = testUser;
    testUniqueItem.pointsSpent = 50;
    testUniqueItem.createdAt = new Date();
  });

  describe('UniqueItem properties', () => {
    it('should have all required properties from DefaultItem', () => {
      expect(testUniqueItem.name).toBe('Test Unique Item');
      expect(testUniqueItem.type).toBe(ItemType.PowerUp);
      expect(testUniqueItem.purchaseType).toBe(PurchaseType.Points);
      expect(testUniqueItem.user).toBe(testUser);
    });

    it('should have pointsSpent property', () => {
      expect(testUniqueItem.pointsSpent).toBe(50);
    });

    it('should allow pointsSpent to be undefined', () => {
      // pointsSpent is defined as number in the entity, but can be set to undefined at runtime
      // Use type assertion to test this behavior
      (testUniqueItem as { pointsSpent?: number }).pointsSpent = undefined;
      expect(testUniqueItem.pointsSpent).toBeUndefined();
    });

    it('should have createdAt property', () => {
      expect(testUniqueItem.createdAt).toBeInstanceOf(Date);
    });

    it('should be an instance of UniqueItem', () => {
      expect(testUniqueItem).toBeInstanceOf(UniqueItem);
    });
  });
});
