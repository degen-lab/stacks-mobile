import { FastifyInstance } from 'fastify';
import { ssvSchema } from '../validators/adMobValidator';
import { logger } from '../helpers/logger';
import { TransactionService } from '../../application/transaction/transactionService';
import { BaseError } from '../../shared/errors/baseError';

export default function adMobGetRoutes(
  app: FastifyInstance,
  { transactionService }: { transactionService: TransactionService },
) {
  app.get('/ssv', {
    handler: async (request, reply) => {
      try {
        const parsed = ssvSchema.safeParse(request.query);
        if (!parsed.success) {
          logger.warn({
            msg: 'Validation Error',
            method: request.method,
            err: parsed.error,
          });

          return reply.status(400).send({
            success: false,
            message: 'Invalid body',
            error: parsed.error.message,
          });
        }
        const data = parsed.data;
        const rawQueryString = request.raw.url?.split('?')[1] ?? '';
        await transactionService.validateSsv(
          data.user_id,
          data.custom_data,
          data.key_id,
          data.signature,
          rawQueryString,
        );
        logger.info({
          msg: 'SSV validated successfully',
          method: request.method,
          data: data,
        });
        return reply.status(200).send({
          success: true,
          message: 'SSV validated successfully',
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /ssv route',
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
