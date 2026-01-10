import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/api/server';
import {
  createTestDataSource,
  closeTestDataSource,
  cleanTestDatabase,
  getTestDataSource,
} from './testDataSource';
import { User } from '../../src/domain/entities/user';
import { ItemType, ItemVariant } from '../../src/domain/entities/enums';
import { ConsumableItem } from '../../src/domain/entities/consumableItem';
import { storeItems } from '../../src/domain/helpers/gameStoreItems';

describe('Game Store Purchase Integration Tests', () => {
  let app: FastifyInstance;
  const testGoogleId = '123456789012345678901234567890';
  const testNickName = 'TestUser';
  let authToken: string;
  let userId: number;

  /**
   * Helper function to update user points in the database
   */
  const updateUserPoints = async (
    userId: number,
    points: number,
  ): Promise<void> => {
    const dataSource = getTestDataSource();
    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.points = points;
      await userRepository.save(user);
    }
  };

  beforeAll(async () => {
    // Initialize test database
    await createTestDataSource();

    // Build Fastify server with test DataSource
    const dataSource = getTestDataSource();
    app = await buildServer(dataSource);
    await app.ready();

    // Create a user and get auth token
    const authResponse = await app.inject({
      method: 'POST',
      url: '/user/auth',
      payload: {
        googleId: testGoogleId,
        nickName: testNickName,
      },
    });

    const authBody = JSON.parse(authResponse.body);
    userId = authBody.data.id;
    authToken = authBody.token;
  });

  afterEach(async () => {
    // Clean database between tests
    await cleanTestDatabase();

    // Recreate user and token after cleanup
    const authResponse = await app.inject({
      method: 'POST',
      url: '/user/auth',
      payload: {
        googleId: testGoogleId,
        nickName: testNickName,
      },
    });

    const authBody = JSON.parse(authResponse.body);
    userId = authBody.data.id;
    authToken = authBody.token;
  });

  afterAll(async () => {
    // Close server and database connections
    if (app) {
      await app.close();
    }
    await closeTestDataSource();
  });

  describe('POST /store/purchase', () => {
    it('should purchase a consumable item successfully', async () => {
      const revivePrice = storeItems[ItemVariant.Revive].price;
      const initialPoints = 200;
      // Give user enough points
      await updateUserPoints(userId, initialPoints);

      const response = await app.inject({
        method: 'POST',
        url: '/store/purchase',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          itemType: ItemType.PowerUp,
          metadata: {
            variant: ItemVariant.Revive,
          },
          quantity: 1,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Item purchased successfully');
      expect(body.data).toBeDefined();
      expect(body.data.points).toBe(initialPoints - revivePrice);
      expect(body.data.items).toBeDefined();
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0].type).toBe(ItemType.PowerUp);
      expect(body.data.items[0].quantity).toBe(1);

      // Verify in database
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['items'],
      });

      expect(user?.points).toBe(initialPoints - revivePrice);
      expect(user?.items.length).toBe(1);
      expect(user?.items[0].type).toBe(ItemType.PowerUp);
      const consumableItem = user?.items[0] as ConsumableItem;
      expect(consumableItem.quantity).toBe(1);
    });

    it('should purchase a unique item successfully', async () => {
      const purpleSkinPrice = storeItems[ItemVariant.PurpleSkin].price;
      const initialPoints = 600;
      // Give user enough points
      await updateUserPoints(userId, initialPoints);

      const response = await app.inject({
        method: 'POST',
        url: '/store/purchase',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          itemType: ItemType.Skin,
          metadata: {
            variant: ItemVariant.PurpleSkin,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.message).toBe('Item purchased successfully');
      expect(body.data).toBeDefined();
      expect(body.data.points).toBe(initialPoints - purpleSkinPrice);
      expect(body.data.items).toBeDefined();
      expect(body.data.items.length).toBe(1);
      expect(body.data.items[0].type).toBe(ItemType.Skin);

      // Verify in database
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['items'],
      });

      expect(user?.points).toBe(initialPoints - purpleSkinPrice);
      expect(user?.items.length).toBe(1);
      expect(user?.items[0].type).toBe(ItemType.Skin);
    });

    it('should throw an error if the user does not have enough points for consumable item', async () => {
      await updateUserPoints(userId, 10);

      const response = await app.inject({
        method: 'POST',
        url: '/store/purchase',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          itemType: ItemType.PowerUp,
          metadata: {
            variant: ItemVariant.Revive,
          },
          quantity: 1,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.message).toBe(
        'User does not have enough points to purchase this item',
      );

      // Verify user points were not deducted
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['items'],
      });

      expect(user?.points).toBe(10); // Points unchanged
      expect(user?.items.length).toBe(0); // No items purchased
    });

    it('should throw an error if the user does not have enough points for unique item', async () => {
      const purpleSkinPrice = storeItems[ItemVariant.PurpleSkin].price;
      const insufficientPoints = purpleSkinPrice - 1;
      // Give user insufficient points
      await updateUserPoints(userId, insufficientPoints);

      const response = await app.inject({
        method: 'POST',
        url: '/store/purchase',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          itemType: ItemType.Skin,
          metadata: {
            variant: ItemVariant.PurpleSkin,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(false);
      expect(body.message).toBe(
        'User does not have enough points to purchase this item',
      );

      // Verify user points were not deducted
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['items'],
      });

      expect(user?.points).toBe(insufficientPoints); // Points unchanged
      expect(user?.items.length).toBe(0); // No items purchased
    });

    it('should merge quantities when purchasing the same consumable item multiple times', async () => {
      const revivePrice = storeItems[ItemVariant.Revive].price;
      const initialPoints = 50;
      // Give user enough points for 2 purchases
      await updateUserPoints(userId, initialPoints);

      // First purchase
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/store/purchase',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          itemType: ItemType.PowerUp,
          metadata: {
            variant: ItemVariant.Revive,
          },
          quantity: 1,
        },
      });

      expect(firstResponse.statusCode).toBe(200);
      const firstBody = JSON.parse(firstResponse.body);
      expect(firstBody.data.points).toBe(initialPoints - revivePrice);
      expect(firstBody.data.items.length).toBe(1);
      expect(firstBody.data.items[0].quantity).toBe(1);

      // Second purchase of same item
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/store/purchase',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          itemType: ItemType.PowerUp,
          metadata: {
            variant: ItemVariant.Revive,
          },
          quantity: 1,
        },
      });

      expect(secondResponse.statusCode).toBe(200);
      const secondBody = JSON.parse(secondResponse.body);
      expect(secondBody.data.points).toBe(initialPoints - revivePrice * 2);
      expect(secondBody.data.items.length).toBe(1); // Same item, merged
      expect(secondBody.data.items[0].quantity).toBe(2); // Quantities merged

      // Verify in database
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['items'],
      });

      expect(user?.points).toBe(initialPoints - revivePrice * 2);
      expect(user?.items.length).toBe(1);
      const consumableItem = user?.items[0] as ConsumableItem;
      expect(consumableItem.quantity).toBe(2);
    });
  });
});
