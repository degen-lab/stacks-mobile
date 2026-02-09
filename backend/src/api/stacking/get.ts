import { FastifyInstance } from 'fastify';
import { StackingService } from '../../application/stacking/stackingService';
import { UserToken } from '../config/types';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';

export default function stackingGetRoutes(
  app: FastifyInstance,
  {
    stackingService,
  }: {
    stackingService: StackingService;
  },
) {
  app.get('/user/:userId', {
    preHandler: app.authenticateUser,
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        const { userId } = request.params as { userId: string };

        // Users can only access their own data
        if (user.id !== parseInt(userId)) {
          return reply.status(403).send({
            success: false,
            message: 'Forbidden',
          });
        }

        const stackingData = await stackingService.getUserStackingData(
          parseInt(userId),
        );

        return reply.status(200).send({
          success: true,
          data: stackingData,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /user/:userId route',
          method: request.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return reply.status(400).send({
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
