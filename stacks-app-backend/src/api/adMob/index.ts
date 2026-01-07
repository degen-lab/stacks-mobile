import { FastifyInstance } from 'fastify';
import { TransactionService } from '../../application/transaction/transactionService';
import adMobGetRoutes from './get';

export default function adMobRoutes(
  app: FastifyInstance,
  { transactionService }: { transactionService: TransactionService },
) {
  app.register(adMobGetRoutes, {
    transactionService,
  });
}
