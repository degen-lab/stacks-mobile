import { FastifyInstance } from 'fastify';
import { UserService } from '../../application/user/userService';
import userPostRoutes from './post';
import userGetRoutes from './get';

export default async function userRoutes(
  app: FastifyInstance,
  {
    userService,
  }: {
    userService: UserService;
  },
) {
  app.register(userPostRoutes, {
    userService,
  });
  app.register(userGetRoutes, {
    userService,
  });
}
