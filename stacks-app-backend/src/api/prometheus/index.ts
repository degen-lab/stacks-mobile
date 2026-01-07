import { FastifyInstance } from 'fastify';
import prometheusGetRoutes from './get';

export default function prometheusRoutes(app: FastifyInstance) {
  app.register(prometheusGetRoutes);
}
