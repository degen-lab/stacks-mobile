import { FastifyInstance } from 'fastify';
import { UserService } from '../../application/user/userService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { UserToken } from '../config/types';
import { gameSessionDataSchema } from '../validators/gameSessionDataValidator';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';
import { TransactionService } from '../../application/transaction/transactionService';
import { Submission } from '../../domain/entities/submission';

export default function gameSessionPostRoutes(
  app: FastifyInstance,
  {
    userService,
    transactionService,
  }: {
    userService: UserService;
    transactionService: TransactionService;
  },
) {
  app.post('/validate', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 3,
        timeWindow: '60000',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too many requests',
          message: 'Too many requests, please try again later',
        }),
      }),
    },
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        const body = gameSessionDataSchema.safeParse(request.body);
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
        const {
          sessionScore,
          pointsEarned,
          totalPoints,
          isFraud,
          fraudReason,
          debug,
        } = await userService.validateSessionAndAwardPoints(
          user.id,
          data.sessionData,
          { debug: data.debug },
        );
        let submission: Submission | undefined = undefined;
        let serializedTx: string | undefined = undefined;
        if (data.transactionData && !isFraud) {
          const result = await transactionService.createUnsignedTransaction(
            user.id,
            data.transactionData.address,
            data.transactionData.publicKey,
            sessionScore,
            data.transactionData.submissionType,
            data.transactionData.isSponsored,
          );
          submission = result.submission;
          serializedTx = result.serializedTx;
        }
        const responseData = {
          sessionScore,
          pointsEarned,
          totalPoints,
          isFraud,
          fraudReason,
          submission,
          serializedTx,
          ...(debug ? { debug } : {}),
        };
        return reply.status(200).send({
          success: true,
          message: 'Session validated successfully',
          data: responseData,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /validate route',
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

  app.post('/generate-seed', {
    preHandler: app.authenticateUser,
    handler: async (request, reply) => {
      try {
        const { seed, signature } = await userService.generateRandomSeed();
        return reply.status(200).send({
          success: true,
          message: 'Seed generated successfully',
          data: { seed, signature },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in generate seed route',
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
