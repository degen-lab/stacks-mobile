import { FastifyInstance } from 'fastify';
import { StackingService } from '../../application/stacking/stackingService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { UserToken } from '../config/types';
import { saveStackingDataSchema } from '../validators/stackingValidator';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';

export default function stackingPostRoutes(
  app: FastifyInstance,
  {
    stackingService,
  }: {
    stackingService: StackingService;
  },
) {
  app.post('/save', {
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
    preHandler: app.authenticateUser,
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        const body = saveStackingDataSchema.safeParse(request.body);

        if (!body.success) {
          logger.error({
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
        const stackingData = await stackingService.saveStackingData(
          user.id,
          data.txId,
          data.poolName,
        );
        return reply.status(200).send({
          success: true,
          message: 'Stacking data saved successfully',
          data: {
            stackingData,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /save route',
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
