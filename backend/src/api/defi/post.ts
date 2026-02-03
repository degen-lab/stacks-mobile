import { FastifyInstance } from 'fastify';
import { DefiService } from '../../application/defi/defiService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { UserToken } from '../config/types';
import { saveLendingOperationSchema } from '../validators/lendingValidator';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';

export default function postDefiRoutes(
  app: FastifyInstance,
  {
    defiService,
  }: {
    defiService: DefiService;
  },
) {
  app.post('/save-lending-operation', {
    config: {
      rateLimit: rateLimitOptions({
        max: 5,
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
        const body = saveLendingOperationSchema.safeParse(request.body);

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
        const defiOperation = await defiService.saveLendingOperation(
          user.id,
          data.txId,
          data.senderAddress,
          data.amount,
          data.assetId,
          data.assetContract,
        );

        return reply.status(200).send({
          success: true,
          message: 'Lending operation saved successfully',
          data: {
            defiOperation,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /save-lending-operation route',
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
