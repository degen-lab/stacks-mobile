import { ConsumableItem } from '../../../src/domain/entities/consumableItem';
import { InsuficientQuantityError } from '../../../src/domain/errors/itemsErrors';
import { ItemType, PurchaseType } from '../../../src/domain/entities/enums';
import { User } from '../../../src/domain/entities/user';

describe('ConsumableItem domain class Unit tests', () => {
  let testConsumableItem: ConsumableItem;
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

    testConsumableItem = new ConsumableItem();
    testConsumableItem.name = 'Test Item';
    testConsumableItem.type = ItemType.PowerUp;
    testConsumableItem.purchaseType = PurchaseType.Points;
    testConsumableItem.user = testUser;
    testConsumableItem.quantity = 5;
  });

  describe('consume invariant', () => {
    it('should consume item successfully when quantity is greater than 0', () => {
      expect(testConsumableItem.quantity).toEqual(5);
      testConsumableItem.consume();
      expect(testConsumableItem.quantity).toEqual(4);
    });

    it('should throw an error if quantity is 0', () => {
      testConsumableItem.quantity = 0;

      expect(() => {
        testConsumableItem.consume();
      }).toThrow(InsuficientQuantityError);
    });

    it('should throw an error after consuming all items', () => {
      testConsumableItem.quantity = 1;
      testConsumableItem.consume();
      expect(testConsumableItem.quantity).toEqual(0);

      expect(() => {
        testConsumableItem.consume();
      }).toThrow(InsuficientQuantityError);
    });
  });
});
