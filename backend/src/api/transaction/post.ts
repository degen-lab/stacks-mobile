import { TransactionService } from '../../application/transaction/transactionService';
import { FastifyInstance } from 'fastify';
import { rateLimitOptions } from '../config/rateLimitConfig';
import {
  broadcastTxSchema,
  createTransactionSchema,
} from '../validators/transactionValidator';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';
import { UserToken } from '../config/types';

export default function transactionPostRoutes(
  app: FastifyInstance,
  {
    transactionService,
  }: {
    transactionService: TransactionService;
  },
) {
  app.post('/create', {
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
        const body = createTransactionSchema.safeParse(request.body);
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
        const unsignedTransaction =
          await transactionService.createUnsignedTransaction(
            user.id,
            data.address,
            data.publicKey,
            data.score,
            data.submissionType,
            data.isSponsored,
          );
        return reply.status(200).send({
          success: true,
          message: 'Transaction created successfully',
          data: {
            unsignedTransaction,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /create route',
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

  app.post('/broadcast-sponsored', {
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
        const body = broadcastTxSchema.safeParse(request.body);
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
        const submission =
          await transactionService.processSubmissionTransaction(
            user.id,
            data.submissionId,
            data.serializedTx,
          );
        return reply.status(200).send({
          success: true,
          message: 'Transaction saved to queue successfully',
          data: {
            submission,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /broadcast route',
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

  app.post('/broadcast', {
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
        const body = broadcastTxSchema.safeParse(request.body);
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
        const transactionResult =
          await transactionService.submitNormalTransaction(
            user.id,
            data.submissionId,
            data.serializedTx,
          );
        return reply.status(200).send({
          success: true,
          message: 'Transaction saved to queue successfully',
          data: {
            transactionResult,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /broadcast route',
          method: request.method,
          err: error,
        });
      }
      return reply.status(500).send({
        success: false,
        message: 'An unknown error occurred',
      });
    },
  });
}
