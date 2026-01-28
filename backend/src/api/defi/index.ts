import { FastifyInstance } from 'fastify';
import { DefiService } from '../../application/defi/defiService';
import getDefiRoutes from './get';
import patchDefiRoutes from './patch';

export default function defiRoutes(
  app: FastifyInstance,
  {
    defiService,
  }: {
    defiService: DefiService;
  },
) {
  app.register(getDefiRoutes, {
    defiService,
  });

  app.register(patchDefiRoutes, {
    defiService,
  });
}
