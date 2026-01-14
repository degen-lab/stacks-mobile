import { FastifyInstance } from 'fastify';
import { CryptoPurchaseService } from '../../application/purchase/cryptoPurchaseService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { UserToken } from '../config/types';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';
import { createWidgetUrlSchema } from '../validators/purchaseValidator';

export default function purchasePostRoutes(
  app: FastifyInstance,
  {
    cryptoPurchaseService,
  }: {
    cryptoPurchaseService: CryptoPurchaseService;
  },
) {
  app.post('/create-widget-url', {
    config: {
      preHandler: app.authenticateUser,
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
        const body = createWidgetUrlSchema.safeParse(request.body);
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
        const widgetUrl = await cryptoPurchaseService.createPurchaseSession(
          user.id,
          data.cryptoCurrencyCode,
          data.fiatCurrency,
          data.fiatAmount,
        );
        return reply.status(200).send({
          success: true,
          message: 'Purchase session created successfully',
          data: { widgetUrl },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in POST /create-widget-url route',
          method: request.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return reply
            .status(400)
            .send({ success: false, message: error.message });
        }
        return reply
          .status(500)
          .send({ success: false, message: 'An unknown error occurred' });
      }
    },
  });
}
