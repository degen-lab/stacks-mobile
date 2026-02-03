import { FastifyInstance } from 'fastify';
import { DefiService } from '../../application/defi/defiService';
import getDefiRoutes from './get';
import postDefiRoutes from './post';
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

  app.register(postDefiRoutes, {
    defiService,
  });

  app.register(patchDefiRoutes, {
    defiService,
  });
}
