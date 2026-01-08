import { FastifyInstance } from 'fastify';
import { GameStoreService } from '../../application/gameStore/gameStoreService';
import gameStorePostRoutes from './post';
import gameStoreGetRoutes from './get';

export default function gameStoreRoutes(
  app: FastifyInstance,
  {
    gameStoreService,
  }: {
    gameStoreService: GameStoreService;
  },
) {
  app.register(gameStorePostRoutes, {
    gameStoreService,
  });
  app.register(gameStoreGetRoutes, {
    gameStoreService,
  });
}
