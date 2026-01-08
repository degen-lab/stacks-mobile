import { FastifyInstance } from 'fastify';
import { TransactionService } from '../../application/transaction/transactionService';
import transactionPostRoutes from './post';
import deleteTransactionRoute from './delete';

export default function transactionRoutes(
  app: FastifyInstance,
  {
    transactionService,
  }: {
    transactionService: TransactionService;
  },
) {
  app.register(transactionPostRoutes, {
    transactionService,
  });

  app.register(deleteTransactionRoute, {
    transactionService,
  });
}
