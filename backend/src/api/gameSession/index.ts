import { FastifyInstance } from 'fastify';
import { UserService } from '../../application/user/userService';
import gameSessionPostRoutes from './post';
import gameSessionGetRoutes from './get';
import { StreakService } from '../../application/streaks/streakService';
import { TransactionService } from '../../application/transaction/transactionService';

export default function gameSessionRoutes(
  app: FastifyInstance,
  {
    userService,
    streakService,
    transactionService,
  }: {
    streakService: StreakService;
    userService: UserService;
    transactionService: TransactionService;
  },
) {
  app.register(gameSessionPostRoutes, {
    userService,
    transactionService,
  });
  app.register(gameSessionGetRoutes, {
    streakService,
  });
}
