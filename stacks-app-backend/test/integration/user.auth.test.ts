import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/api/server';
import {
  createTestDataSource,
  closeTestDataSource,
  cleanTestDatabase,
  getTestDataSource,
} from './testDataSource';
import { User } from '../../src/domain/entities/user';

describe('User Auth Integration Tests', () => {
  let app: FastifyInstance;
  const testGoogleId = '123456789012345678901234567890'; // 30 chars, meets min 21 requirement
  const testNickName = 'TestUser';

  beforeAll(async () => {
    // Initialize test database
    await createTestDataSource();

    // Build Fastify server with test DataSource
    const dataSource = getTestDataSource();
    app = await buildServer(dataSource);
    await app.ready();
  });

  afterEach(async () => {
    // Clean database between tests
    await cleanTestDatabase();
  });

  afterAll(async () => {
    // Close server and database connections
    if (app) {
      await app.close();
    }
    await closeTestDataSource();
  });

  describe('POST /user/auth', () => {
    it('should create a new user on first request', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/user/auth',
        payload: {
          googleId: testGoogleId,
          nickName: testNickName,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(body.message).toBe('user logged in successfully');
      expect(body.data).toBeDefined();
      expect(body.data.id).toBeDefined();
      expect(body.data.nickname).toBe(testNickName);
      expect(body.data.points).toBe(0);
      expect(body.data.streak).toBe(0);
      expect(body.data.referralCode).toBeDefined();
      expect(body.token).toBeDefined();

      // Verify user was created in database
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const createdUser = await userRepository.findOne({
        where: { googleId: testGoogleId },
      });

      expect(createdUser).toBeDefined();
      expect(createdUser?.id).toBe(body.data.id);
      expect(createdUser?.googleId).toBe(testGoogleId);
      expect(createdUser?.nickName).toBe(testNickName);
    });

    it('should return the same user on second request with same credentials', async () => {
      // First request - create user
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/user/auth',
        payload: {
          googleId: testGoogleId,
          nickName: testNickName,
        },
      });

      expect(firstResponse.statusCode).toBe(200);
      const firstBody = JSON.parse(firstResponse.body);
      const firstUserId = firstBody.data.id;

      // Second request - should return same user
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/user/auth',
        payload: {
          googleId: testGoogleId,
          nickName: testNickName,
        },
      });

      expect(secondResponse.statusCode).toBe(200);
      const secondBody = JSON.parse(secondResponse.body);

      expect(secondBody.success).toBe(true);
      expect(secondBody.data.id).toBe(firstUserId); // Same user ID
      expect(secondBody.data.nickname).toBe(testNickName);
      expect(secondBody.data.referralCode).toBe(firstBody.data.referralCode); // Same referral code

      // Verify only one user exists in database
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const allUsers = await userRepository.find({
        where: { googleId: testGoogleId },
      });

      expect(allUsers.length).toBe(1);
      expect(allUsers[0].id).toBe(firstUserId);
    });

    it('should return the same user even if nickname is different on second request', async () => {
      // First request - create user
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/user/auth',
        payload: {
          googleId: testGoogleId,
          nickName: testNickName,
        },
      });

      expect(firstResponse.statusCode).toBe(200);
      const firstBody = JSON.parse(firstResponse.body);
      const firstUserId = firstBody.data.id;

      // Second request with different nickname - should still return same user
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/user/auth',
        payload: {
          googleId: testGoogleId,
          nickName: 'DifferentNickname',
        },
      });

      expect(secondResponse.statusCode).toBe(200);
      const secondBody = JSON.parse(secondResponse.body);

      expect(secondBody.data.id).toBe(firstUserId); // Same user ID
      // Note: The nickname in the response might be the original one since
      // the service returns the existing user without updating the nickname
      expect(secondBody.data.nickname).toBe(testNickName); // Original nickname preserved

      // Verify only one user exists
      const dataSource = getTestDataSource();
      const userRepository = dataSource.getRepository(User);
      const allUsers = await userRepository.find({
        where: { googleId: testGoogleId },
      });

      expect(allUsers.length).toBe(1);
    });
  });
});
