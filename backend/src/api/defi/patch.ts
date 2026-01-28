import { FastifyInstance } from 'fastify';
import { DefiService } from '../../application/defi/defiService';
import { UserToken } from '../config/types';
import { logger } from '../helpers/logger';
import { BaseError } from '../../shared/errors/baseError';

export default function patchDefiRoutes(
  app: FastifyInstance,
  {
    defiService,
  }: {
    defiService: DefiService;
  },
) {
  app.patch<{ Params: { id: number }; Body: { txId: string } }>(
    '/update-defi-operation/:id',
    {
      preHandler: app.authenticateUser,
      handler: async (req, res) => {
        try {
          const user = req.user as UserToken;
          const { id } = req.params as { id: number };
          const { txId } = req.body as { txId: string };
          await defiService.updateDefiOperation(user.id, id, txId);
          return res.status(200).send({
            success: true,
            message: 'Defi operation updated successfully',
          });
        } catch (error) {
          logger.error({
            msg: 'Error in update defi operation route',
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
    },
  );
}
