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
      // Give user enough points (100 points for 1 Power-Up)
      await updateUserPoints(userId, 200);

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
      expect(body.data.points).toBe(185); // 200 - 15 = 185
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

      expect(user?.points).toBe(185);
      expect(user?.items.length).toBe(1);
      expect(user?.items[0].type).toBe(ItemType.PowerUp);
      const consumableItem = user?.items[0] as ConsumableItem;
      expect(consumableItem.quantity).toBe(1);
    });

    it('should purchase a unique item successfully', async () => {
      // Give user enough points (500 points for PurpleSkin)
      await updateUserPoints(userId, 600);

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
      expect(body.data.points).toBe(100); // 600 - 500 = 100
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

      expect(user?.points).toBe(100);
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
      // Give user insufficient points (400 points, need 500 for PurpleSkin)
      await updateUserPoints(userId, 400);

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

      expect(user?.points).toBe(400); // Points unchanged
      expect(user?.items.length).toBe(0); // No items purchased
    });

    it('should merge quantities when purchasing the same consumable item multiple times', async () => {
      // Give user enough points for 2 purchases (30 points for 2 items at 15 each)
      await updateUserPoints(userId, 50);

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
      expect(firstBody.data.points).toBe(35); // 50 - 15 = 35
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
      expect(secondBody.data.points).toBe(20); // 35 - 15 = 20
      expect(secondBody.data.items.length).toBe(1); // Same item, merged
      expect(secondBody.data.items[0].quantity).toBe(2); // Quantities merged

      // Verify in database
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['items'],
      });

      expect(user?.points).toBe(20); // 50 - 15 - 15 = 20
      expect(user?.items.length).toBe(1);
      const consumableItem = user?.items[0] as ConsumableItem;
      expect(consumableItem.quantity).toBe(2);
    });
  });
});
