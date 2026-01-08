import { GameStoreService } from '../../application/gameStore/gameStoreService';
import { FastifyInstance } from 'fastify';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';
import { UserToken } from '../config/types';
import { purchaseItemSchema } from '../validators/gameStoreValidatiorSchema';
import { ItemType } from '../../domain/entities/enums';

export default async function gameStorePostRoutes(
  app: FastifyInstance,
  {
    gameStoreService,
  }: {
    gameStoreService: GameStoreService;
  },
) {
  app.post('/purchase', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 2,
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
        const user = request.user as UserToken;
        const body = purchaseItemSchema.safeParse(request.body);
        if (!body.success) {
          logger.warn({
            msg: 'Validation Error',
            method: request.method,
            err: body.error,
          });
          return reply.status(400).send({
            success: false,
            message: 'Invalid body',
            error: body.error.message,
          });
        }
        const data = body.data;
        const result = await gameStoreService.purchaseItem(
          user.id,
          data.itemType as ItemType, // Cast to ItemType enum (0 or 1)
          data.metadata.variant,
          data.quantity,
        );
        // Serialize items without circular reference (remove user property)
        const serializedItems = result.items.map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { user: _, ...itemWithoutUser } = item;
          return itemWithoutUser;
        });
        return reply.status(200).send({
          success: true,
          message: 'Item purchased successfully',
          data: {
            points: result.points,
            items: serializedItems,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /purchase route',
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
