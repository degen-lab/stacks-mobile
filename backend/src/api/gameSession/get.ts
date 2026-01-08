import { FastifyInstance } from 'fastify';
import { StreakService } from '../../application/streaks/streakService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';

export default function gameSessionGetRoutes(
  app: FastifyInstance,
  {
    streakService,
  }: {
    streakService: StreakService;
  },
) {
  app.get('/daily-streak', {
    preHandler: app.authenticateUser,
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
    handler: async (request, reply) => {
      try {
        let dailyStreak;
        try {
          dailyStreak = await streakService.getDailyStreak();
        } catch (error) {
          // If challenge doesn't exist, initialize it automatically
          logger.warn({
            msg: 'Daily streak challenge not found, initializing...',
            err: error,
          });
          dailyStreak = await streakService.setDailyStreak();
          logger.info(
            `Auto-initialized daily streak challenge: ${dailyStreak.description}`,
          );
        }
        return reply.status(200).send({
          success: true,
          message: 'Daily streak retrieved successfully',
          data: {
            description: dailyStreak.description,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in get daily streak route',
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
