import { FastifyInstance } from 'fastify';
import { CryptoPurchaseService } from '../../application/purchase/cryptoPurchaseService';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';
import {
  transakWebhookPayloadSchema,
  TransakWebhookPayload,
} from '../validators/purchaseValidator';

interface TransakWebhookBody {
  data: string; // JWT encrypted payload
}

export default function purchaseWebhookRoutes(
  app: FastifyInstance,
  {
    cryptoPurchaseService,
  }: {
    cryptoPurchaseService: CryptoPurchaseService;
  },
) {
  app.post<{ Body: TransakWebhookBody }>('/webhook', {
    handler: async (request, reply) => {
      try {
        const { data } = request.body;

        if (!data) {
          logger.warn({
            msg: 'Webhook received without data field',
            body: request.body,
          });
          return reply.status(400).send({
            success: false,
            message: 'Missing data field in webhook payload',
          });
        }

        // Get access token to decrypt the webhook payload
        const accessToken =
          await cryptoPurchaseService.getAccessTokenForWebhook();

        // Decrypt the JWT payload using the access token
        let decodedPayload: TransakWebhookPayload;
        try {
          decodedPayload = app.jwt.verify(data, {
            key: accessToken,
          }) as TransakWebhookPayload;
        } catch (jwtError) {
          logger.error({
            msg: 'Failed to verify webhook JWT',
            err: jwtError,
          });
          return reply.status(401).send({
            success: false,
            message: 'Invalid webhook signature',
          });
        }

        // Validate the decoded payload
        const validationResult =
          transakWebhookPayloadSchema.safeParse(decodedPayload);
        if (!validationResult.success) {
          logger.warn({
            msg: 'Webhook payload validation failed',
            err: validationResult.error,
            payload: decodedPayload,
          });
          return reply.status(400).send({
            success: false,
            message: 'Invalid webhook payload structure',
          });
        }

        const webhookData = validationResult.data.webhookData;

        logger.info({
          msg: 'Transak webhook received',
          orderId: webhookData.id,
          partnerCustomerId: webhookData.partnerCustomerId,
          status: webhookData.status,
        });

        // Update purchase status
        const updatedPurchase =
          await cryptoPurchaseService.updatePurchaseFromWebhook({
            id: webhookData.id,
            partnerCustomerId: webhookData.partnerCustomerId,
            partnerOrderId: webhookData.partnerOrderId,
            status: webhookData.status,
            cryptoAmount: webhookData.cryptoAmount,
            transactionHash: webhookData.transactionHash,
          });

        logger.info({
          msg: 'Purchase updated from webhook',
          purchaseId: updatedPurchase.id,
          newStatus: updatedPurchase.status,
        });

        return reply.status(200).send({
          success: true,
          message: 'Webhook processed successfully',
        });
      } catch (error) {
        logger.error({
          msg: 'Error processing Transak webhook',
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
          message: 'An error occurred processing the webhook',
        });
      }
    },
  });
}
