import { FastifyInstance } from 'fastify';
import { TransactionService } from '../../application/transaction/transactionService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import {
  broadcastTxSchema,
  createGameSubmissionTransactionSchema,
  createSponsoredTransactionSchema,
  enqueueSponsoredTransactionSchema,
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
  app.post('/game-submission', {
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
        const body = createGameSubmissionTransactionSchema.safeParse(
          request.body,
        );
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
        const gameSubmissionTransaction =
          await transactionService.createGameSubmissionTransaction(
            user.id,
            data.address,
            data.publicKey,
            data.score,
            data.submissionType,
            data.isSponsored,
            data.feeMicroStx,
          );

        return reply.status(200).send({
          success: true,
          message: 'Game submission transaction created successfully',
          data: {
            unsignedGameSubmissionTransaction: {
              serializedTx: gameSubmissionTransaction.serializedTx,
              submission: {
                id: gameSubmissionTransaction.submission.id,
              },
              requestId: gameSubmissionTransaction.sponsoredRequest?.requestId,
              expiresAt: gameSubmissionTransaction.sponsoredRequest?.expiresAt,
            },
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /transaction/game-submission',
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

  app.post('/sponsored-request', {
    preHandler: app.authenticateUser,
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
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        const body = createSponsoredTransactionSchema.safeParse(request.body);
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

        const result =
          await transactionService.createSponsoredTransactionRequest(
            user.id,
            body.data.originAddress,
            body.data.defiOperationId,
          );

        return reply.status(200).send({
          success: true,
          message: 'Sponsored transaction request created successfully',
          data: result,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /transaction/sponsored-request',
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
        const body = enqueueSponsoredTransactionSchema.safeParse(request.body);
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

        const queuedTransaction =
          await transactionService.enqueueSponsoredTransaction(
            user.id,
            body.data.requestId,
            body.data.serializedTx,
            body.data.dependsOnRequestId,
          );

        return reply.status(200).send({
          success: true,
          message: 'Transaction saved to queue successfully',
          data: {
            requestId: queuedTransaction.id,
            submission: queuedTransaction.submission
              ? { id: queuedTransaction.submission.id }
              : undefined,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /transaction/broadcast-sponsored',
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

        const transactionResult =
          await transactionService.broadcastWalletTransaction(
            user.id,
            body.data.submissionId,
            body.data.serializedTx,
          );
        return reply.status(200).send({
          success: true,
          message: 'Transaction broadcasted successfully',
          data: {
            transactionResult,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /transaction/broadcast',
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
