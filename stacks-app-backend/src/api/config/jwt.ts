import fastifyJwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';
import { JWT_SECRET } from '../../shared/constants';
import fp from 'fastify-plugin';
import { UserToken } from './types';

export default fp(async function (app: FastifyInstance) {
  app.register(fastifyJwt, {
    secret: JWT_SECRET,
  });

  app.decorate('authenticateUser', async function (request, response) {
    await request.jwtVerify();
    const user = request.user as UserToken;
    if (!user.id || !user.googleId || !user.nickName) {
      response.status(401).send({ message: 'Unauthorized' });
    }
  });
});
