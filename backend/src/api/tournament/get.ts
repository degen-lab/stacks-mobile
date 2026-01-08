import { FastifyInstance } from 'fastify';
import { RewardsService } from '../../application/rewards/rewardsService';
import { UserToken } from '../config/types';
import { BaseError } from '../../shared/errors/baseError';
import { logger } from '../helpers/logger';
import { rateLimitOptions } from '../config/rateLimitConfig';

export default function tournamentGetRoutes(
  app: FastifyInstance,
  {
    rewardsService,
  }: {
    rewardsService: RewardsService;
  },
) {
  app.get('/leaderboard', {
    config: {
      rateLimit: rateLimitOptions({
        max: 3,
        timeWindow: '60000',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too many requests',
          message: 'Too many requests, please try again later',
        }),
      }),
    },
    preHandler: app.authenticateUser,
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        const leaderboard = await rewardsService.getLeaderboard(user.id);
        return reply.status(200).send({
          success: true,
          message: 'Leaderboard retrieved successfully',
          data: leaderboard,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in get leaderboard route',
          method: request.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return reply.status(400).send({
            success: false,
            message: error.message,
          });
        }
        return reply.status(500).send({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    },
  });

  app.get<{ Querystring: { tournamentId: number } }>('/previous-tournament', {
    config: {
      rateLimit: rateLimitOptions({
        max: 3,
        timeWindow: '60000',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too many requests',
          message: 'Too many requests, please try again later',
        }),
      }),
    },
    preHandler: app.authenticateUser,
    handler: async (request, reply) => {
      try {
        const tournamentId = request.query.tournamentId;
        const previousTournament =
          await rewardsService.getPreviousTournament(tournamentId);
        return reply.status(200).send({
          success: true,
          message: 'Previous tournament retrieved successfully',
          data: previousTournament,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in get previous tournament route',
          method: request.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return reply.status(400).send({
            success: false,
            message: error.message,
          });
        }
        return reply.status(500).send({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    },
  });

  app.get('/tournament-data', {
    config: {
      rateLimit: rateLimitOptions({
        max: 3,
        timeWindow: '60000',
        errorResponseBuilder: () => ({
          statusCode: 429,
          error: 'Too many requests',
          message: 'Too many requests, please try again later',
        }),
      }),
    },
    preHandler: app.authenticateUser,
    handler: async (request, reply) => {
      try {
        const tournamentData = await rewardsService.getTournamentData();
        return reply.status(200).send({
          success: true,
          message: 'Tournament data retrieved successfully',
          data: tournamentData,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in get tournament data route',
          method: request.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return reply.status(400).send({
            success: false,
            message: error.message,
          });
        }
        return reply.status(500).send({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    },
  });
}
