import { FastifyInstance } from 'fastify';
import { StackingService } from '../../application/stacking/stackingService';
import stackingPostRoutes from './post';
import stackingGetRoutes from './get';

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
  app.register(stackingGetRoutes, {
    stackingService,
  });
}
