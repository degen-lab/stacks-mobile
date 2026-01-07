import { FastifyInstance } from 'fastify';
import client from 'prom-client';
export default function prometheusGetRoutes(app: FastifyInstance) {
  app.get('/metrics', {
    handler: async (_request, reply) => {
      const metrics = await client.register.metrics();
      return reply.type('text/plain').send(metrics);
    },
  });
}
