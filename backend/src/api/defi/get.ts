import { FastifyInstance } from 'fastify';
import { DefiService } from '../../application/defi/defiService';
import { BaseError } from '../../shared/errors/baseError';
import { serializeBigInt } from '../../shared/utils';
import { logger } from '../helpers/logger';
import { rateLimitOptions } from '../config/rateLimitConfig';
import { UserToken } from '../config/types';
import { swapParamsSchema } from '../validators/defiValidator';

export default function getDefiRoutes(
  app: FastifyInstance,
  {
    defiService,
  }: {
    defiService: DefiService;
  },
) {
  app.get('/token-list', {
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
    handler: async (req, res) => {
      try {
        const tokenList = await defiService.getTokenList();
        return res.status(200).send({
          success: true,
          message: 'Token list retrieved successfully',
          data: tokenList,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in get token list route',
          method: req.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return res.status(400).send({
            success: false,
            message: error.message,
          });
        }
        return res.status(500).send({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    },
  });

  app.get<{ Querystring: { tokenId: string } }>('/possible-pair-list', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
        timeWindow: '60000',
      }),
    },
    handler: async (req, res) => {
      try {
        const { tokenId } = req.query as { tokenId: string };
        const possiblePairList = await defiService.getPossiblePairList(tokenId);
        logger.info({
          msg: 'Possible pair list retrieved successfully',
          data: possiblePairList,
        });
        return res.status(200).send({
          success: true,
          message: 'Possible pair list retrieved successfully',
          data: possiblePairList,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in get possible pair list route',
          method: req.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return res.status(400).send({
            success: false,
            message: error.message,
          });
        }
        return res.status(500).send({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    },
  });

  app.get<{
    Querystring: {
      tokenInId: string;
      tokenOutId: string;
      amount: string;
      senderAddress: string;
    };
  }>('/swap-params', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
        timeWindow: '60000',
      }),
    },
    handler: async (req, res) => {
      try {
        const user = req.user as UserToken;
        const validationResult = swapParamsSchema.safeParse(req.query);
        if (!validationResult.success) {
          logger.warn({
            msg: 'Swap params validation failed',
            err: validationResult.error,
          });
          return res.status(400).send({
            success: false,
            message: 'Invalid swap parameters',
            error: validationResult.error.message,
          });
        }
        const { tokenInId, tokenOutId, amount, senderAddress } =
          validationResult.data;
        const { defiOperation, contractCallParams } =
          await defiService.getSwapParams(
            user.id,
            tokenInId,
            tokenOutId,
            senderAddress,
            amount,
          );
        logger.info({
          msg: 'Swap params retrieved successfully',
          data: {
            defiOperation,
            contractCallParams: serializeBigInt(contractCallParams),
          },
        });
        return res.status(200).send({
          success: true,
          message: 'Swap params retrieved successfully',
          data: {
            defiOperation,
            contractCallParams: serializeBigInt(contractCallParams),
          },
        });
      } catch (error) {
        logger.error({
          msg: 'Error in get swap params route',
          method: req.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return res.status(400).send({
            success: false,
            message: error.message,
          });
        }
        return res.status(500).send({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    },
  });

  app.get('/lending-assets', {
    preHandler: app.authenticateUser,
    config: {
      rateLimit: rateLimitOptions({
        max: 10,
        timeWindow: '60000',
      }),
    },
    handler: async (req, res) => {
      try {
        const assets = await defiService.getLendingAssets();
        return res.status(200).send({
          success: true,
          message: 'Lending assets retrieved successfully',
          data: assets,
        });
      } catch (error) {
        logger.error({
          msg: 'Error in GET /lending-assets route',
          method: req.method,
          err: error,
        });
        if (error instanceof BaseError) {
          return res.status(400).send({
            success: false,
            message: error.message,
          });
        }
        return res.status(500).send({
          success: false,
          message: 'An unknown error occurred',
        });
      }
    },
  });
}
