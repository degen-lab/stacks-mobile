import { FastifyRequest, FastifyReply } from 'fastify/types/request';
import { JWT } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    jwt: JWT;
    authenticateUser: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export type UserToken = {
  id: number;
  googleId: string;
  nickName: string;
};
