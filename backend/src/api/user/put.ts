import { FastifyInstance } from 'fastify';
import { UserService } from '../../application/user/userService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';
import { UserToken } from '../config/types';
import { updateConsentSchema } from '../validators/userValidator';

export default async function userPutRoutes(
  app: FastifyInstance,
  {
    userService,
  }: {
    userService: UserService;
  },
) {
  app.put('/consent', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
        timeWindow: '60000',
      }),
    },
    handler: async (request, reply) => {
      try {
        const body = updateConsentSchema.safeParse(request.body);

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

        const user = request.user as UserToken;
        const updatedUser = await userService.updateConsent(user.id, body.data);

        return reply.status(200).send({
          success: true,
          message: 'Consent updated successfully',
          data: {
            analytics: updatedUser.analyticsConsent,
            adsPersonalization: updatedUser.adsPersonalizationConsent,
            version: updatedUser.consentVersion,
            updatedAt: updatedUser.consentUpdatedAt?.toISOString() ?? null,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in PUT /consent route',
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
