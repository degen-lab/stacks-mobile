import { FastifyInstance } from 'fastify';
import { TransactionService } from '../../application/transaction/transactionService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { UserToken } from '../config/types';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';

export default function transactionGetRoutes(
  app: FastifyInstance,
  {
    transactionService,
  }: {
    transactionService: TransactionService;
  },
) {
  app.get('/sponsored-request/:requestId', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 60,
        timeWindow: '60000',
      }),
    },
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        const { requestId } = request.params as { requestId: string };
        const sponsoredRequest =
          await transactionService.getSponsoredRequestStatus(
            user.id,
            requestId,
          );

        return reply.status(200).send({
          success: true,
          message: 'Sponsored transaction request retrieved successfully',
          data: sponsoredRequest,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /transaction/sponsored-request/:requestId',
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
