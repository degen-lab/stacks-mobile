import pino from 'pino';
import { NODE_ENV } from '../../shared/constants';

const isTest = NODE_ENV === 'test' || NODE_ENV === 'testing';

export const logger = pino({
  level: isTest ? 'silent' : process.env.LOG_LEVEL || 'info',
  transport: isTest
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: true },
      },
});
