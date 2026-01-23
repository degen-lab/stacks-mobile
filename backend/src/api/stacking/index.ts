import { FastifyInstance } from 'fastify';
import { StackingService } from '../../application/stacking/stackingService';
import stackingPostRoutes from './post';
export default function stackingRoutes(
  app: FastifyInstance,
  {
    stackingService,
  }: {
    stackingService: StackingService;
  },
) {
  app.register(stackingPostRoutes, {
    stackingService,
  });
}
