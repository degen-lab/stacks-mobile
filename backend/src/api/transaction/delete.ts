import { FastifyInstance } from 'fastify';
import { TransactionService } from '../../application/transaction/transactionService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { UserToken } from '../config/types';
import { BaseError } from '../../shared/errors/baseError';
import { logger } from '../helpers/logger';

export default async function deleteTransactionRoute(
  app: FastifyInstance,
  {
    transactionService,
  }: {
    transactionService: TransactionService;
  },
) {
  app.delete<{ Params: { id: number } }>('/:id', {
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
        const id = request.params.id;
        await transactionService.deleteSubmission(user.id, id);
        return reply.status(200).send({
          success: true,
          message: 'Submission deleted successfully',
        });
      } catch (error) {
        logger.error({
          msg: 'Error in DELETE /transaction route',
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
