import fastifyJwt from '@fastify/jwt';
import Fastify, { FastifyInstance } from 'fastify';
import { UserService } from '../../../src/application/user/userService';
import userDeleteRoutes from '../../../src/api/user/delete';

describe('DELETE /user/account', () => {
  let app: FastifyInstance;
  const mockDeleteAccount = jest.fn();

  beforeAll(async () => {
    app = Fastify();
    app.register(fastifyJwt, {
      secret: 'test-jwt-secret-key-for-testing-only',
    });
    app.decorate('authenticateUser', async function (request, reply) {
      await request.jwtVerify();
      const user = request.user as {
        id?: number;
        googleId?: string;
        nickName?: string;
      };

      if (!user.id || !user.googleId || !user.nickName) {
        reply.status(401).send({ message: 'Unauthorized' });
      }
    });

    app.register(userDeleteRoutes, {
      userService: {
        deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
      } as unknown as UserService,
      prefix: '/user',
    });

    await app.ready();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/user/account',
    });

    expect(response.statusCode).toBe(401);
  });

  it('deletes the authenticated user account', async () => {
    mockDeleteAccount.mockResolvedValue(undefined);
    const token = app.jwt.sign({
      id: 12,
      googleId: 'delete-user-12345678901234567890',
      nickName: 'DeleteUser',
    });

    const response = await app.inject({
      method: 'DELETE',
      url: '/user/account',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(mockDeleteAccount).toHaveBeenCalledWith(12);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({
      success: true,
      message: 'Account deleted successfully',
    });
  });
});
