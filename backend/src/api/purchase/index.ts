import { FastifyInstance } from 'fastify';
import { CryptoPurchaseService } from '../../application/purchase/cryptoPurchaseService';
import purchasePostRoutes from './post';
import purchaseWebhookRoutes from './webhook';

export default function purchaseRoutes(
  app: FastifyInstance,
  {
    cryptoPurchaseService,
  }: {
    cryptoPurchaseService: CryptoPurchaseService;
  },
) {
  app.register(purchasePostRoutes, {
    cryptoPurchaseService,
  });

  app.register(purchaseWebhookRoutes, {
    cryptoPurchaseService,
  });
}
