import { FastifyInstance } from 'fastify';
import { UserService } from '../../application/user/userService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import {
  registerOrLoginSchema,
  reportUserSchema,
} from '../validators/userValidator';
import { logger } from '../helpers/logger';
import { UserToken } from '../config/types';
import { BaseError } from '../../shared/errors/baseError';

export default async function userPostRoutes(
  app: FastifyInstance,
  {
    userService,
  }: {
    userService: UserService;
  },
) {
  app.post('/auth', {
    config: {
      rateLimit: rateLimitOptions({
        max: 3,
        timeWindow: '60000',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too many requests',
          message: 'Too many Requests, please try again later',
        }),
      }),
    },

    handler: async (request, reply) => {
      try {
        const body = registerOrLoginSchema.safeParse(request.body);

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
        const userData = body.data;
        const { user, isNewUser } = await userService.loginOrRegister(
          userData.googleId,
          userData.nickName,
          userData.photoUri,
          userData.referralCode,
        );
        const tokenPayload: UserToken = {
          id: user.id,
          googleId: user.googleId,
          nickName: user.nickName,
        };
        const signedToken = app.jwt.sign(tokenPayload);
        return reply.status(200).send({
          success: true,
          message: 'user logged in successfully',
          token: signedToken,
          data: {
            id: user.id,
            nickname: user.nickName,
            referralCode: user.referralCode,
            streak: user.streak,
            points: user.points,
            isNewUser,
            consent: {
              analytics: user.analyticsConsent,
              adsPersonalization: user.adsPersonalizationConsent,
              version: user.consentVersion,
              updatedAt: user.consentUpdatedAt?.toISOString() ?? null,
            },
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in login route',
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

  app.post('/report', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 5,
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
        const body = reportUserSchema.safeParse(request.body);

        if (!body.success) {
          return reply.status(400).send({
            success: false,
            message: 'Invalid body',
            error: body.error.message,
          });
        }

        if (body.data.reportedUserId === user.id) {
          return reply.status(400).send({
            success: false,
            message: 'Cannot report yourself',
          });
        }

        await userService.reportUser(
          user.id,
          body.data.reportedUserId,
          body.data.reason,
        );

        return reply.status(200).send({
          success: true,
          message: 'Report submitted successfully',
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /report route',
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
