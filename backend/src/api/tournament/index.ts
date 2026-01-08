import { FastifyInstance } from 'fastify';
import { RewardsService } from '../../application/rewards/rewardsService';
import tournamentGetRoutes from './get';

export default function tournamentRoutes(
  app: FastifyInstance,
  {
    rewardsService,
  }: {
    rewardsService: RewardsService;
  },
) {
  app.register(tournamentGetRoutes, {
    rewardsService,
  });
}
