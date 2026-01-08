import { FastifyInstance } from 'fastify';
import { UserService } from '../../application/user/userService';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';
import { UserToken } from '../config/types';

export default function userGetRoutes(
  app: FastifyInstance,
  {
    userService,
  }: {
    userService: UserService;
  },
) {
  app.get('/active-referrals', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
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
        const user = request.user as UserToken;
        const activeReferrals = await userService.getActiveReferrals(user.id);

        const serializedReferrals = activeReferrals.map((referral) => ({
          id: referral.id,
          nickName: referral.nickName,
          photoUri: referral.photoUri || null,
          referralCode: referral.referralCode,
          points: referral.points, // TODO: Add referral bonus earned
          streak: referral.streak,
          createdAt: referral.createdAt,
          lastStreakCompletionDate:
            referral.lastStreakCompletionDate instanceof Date
              ? referral.lastStreakCompletionDate.toISOString()
              : referral.lastStreakCompletionDate || null,
        }));

        return reply.status(200).send({
          success: true,
          message: 'Active referrals retrieved successfully',
          data: {
            count: serializedReferrals.length,
            referrals: serializedReferrals,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /active-referrals route',
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

  app.get('/profile', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
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
        const user = request.user as UserToken;
        const userProfile = await userService.getUserProfile(user.id);

        // Serialize items without circular reference (remove user property)
        const serializedItems = (userProfile.items || []).map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { user: _, ...itemWithoutUser } = item;
          return itemWithoutUser;
        });

        return reply.status(200).send({
          success: true,
          message: 'User profile retrieved successfully',
          data: {
            id: userProfile.id,
            nickname: userProfile.nickName,
            photoUri: userProfile.photoUri || null,
            referralCode: userProfile.referralCode,
            streak: userProfile.streak,
            points: userProfile.points,
            lastStreakCompletionDate:
              userProfile.lastStreakCompletionDate instanceof Date
                ? userProfile.lastStreakCompletionDate.toISOString()
                : userProfile.lastStreakCompletionDate || null,
            items: serializedItems,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /profile route',
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

  app.get('/sponsored-submissions-left', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
        timeWindow: '60000',
      }),
    },
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        const {
          dailyRaffleSubmissionsLeft,
          dailyWeeklyContestSubmissionsLeft,
        } = await userService.getDailySubmissionsLeft(user.id);
        return reply.status(200).send({
          success: true,
          message: 'Sponsored submissions left retrieved successfully',
          data: {
            dailyRaffleSubmissionsLeft,
            dailyWeeklyContestSubmissionsLeft,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /sponsored-submissions-left route',
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

  app.get('/current-tournament-submissions', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
        timeWindow: '60000',
      }),
    },
    handler: async (request, reply) => {
      try {
        const user = request.user as UserToken;
        const {
          weeklyContestSubmissionsForCurrentTournament,
          raffleSubmissionsForCurrentTournament,
        } = await userService.getCurrentTournamentSubmissions(user.id);
        return reply.status(200).send({
          success: true,
          message: 'Current tournament submissions retrieved successfully',
          data: {
            weeklyContestSubmissionsForCurrentTournament,
            raffleSubmissionsForCurrentTournament,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /current-tournament-submissions route',
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

  app.get<{ Querystring: { googleId: string } }>('/is-new-user', {
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
        timeWindow: '60000',
      }),
    },
    handler: async (request, reply) => {
      try {
        const googleId = request.query.googleId;
        const isNewUser = await userService.isNewUser(googleId);
        return reply.status(200).send({
          success: true,
          message: 'Is new user retrieved successfully',
          data: {
            isNewUser,
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /is-new-user route',
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
