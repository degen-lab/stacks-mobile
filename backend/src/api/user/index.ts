import { FastifyInstance } from 'fastify';
import { UserService } from '../../application/user/userService';
import userPostRoutes from './post';
import userGetRoutes from './get';
import userPutRoutes from './put';
import userDeleteRoutes from './delete';

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
  app.register(userPutRoutes, {
    userService,
  });
  app.register(userDeleteRoutes, {
    userService,
  });
}
