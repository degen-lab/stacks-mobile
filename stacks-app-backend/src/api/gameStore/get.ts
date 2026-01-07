import { GameStoreService } from '../../application/gameStore/gameStoreService';
import { FastifyInstance } from 'fastify';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';

export default async function gameStoreGetRoutes(
  app: FastifyInstance,
  {
    gameStoreService,
  }: {
    gameStoreService: GameStoreService;
  },
) {
  app.get('/available-items', {
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
        timeWindow: '60000',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too many requests',
          message: 'Too many requests, please try again after 1 minute',
        }),
      }),
    },
    handler: async (request, reply) => {
      try {
        const items = gameStoreService.getAvailableItems();
        return reply.status(200).send({
          success: true,
          message: 'Available items retrieved successfully',
          data: {
            items,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /available-items route',
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
