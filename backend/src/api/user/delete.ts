import { FastifyInstance } from 'fastify';
import { UserService } from '../../application/user/userService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';
import { UserToken } from '../config/types';

export default async function userDeleteRoutes(
  app: FastifyInstance,
  {
    userService,
  }: {
    userService: UserService;
  },
) {
  app.delete('/account', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 3,
        timeWindow: '60000',
      }),
    },
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        await userService.deleteAccount(user.id);

        return reply.status(200).send({
          success: true,
          message: 'Account deleted successfully',
        });
      } catch (error) {
        logger.error({
          msg: 'Error in DELETE /account route',
          method: request.method,
          err: error,
        });

        if (error instanceof BaseError) {
          return reply.status(error.statusCode).send({
            success: false,
            message: error.message,
          });
        }

        return reply.status(500).send({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    },
  });
}
