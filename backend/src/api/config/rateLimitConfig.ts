import { RateLimitOptions } from '@fastify/rate-limit';
import { NODE_ENV } from '../../shared/constants';

export const rateLimitOptions = (options: RateLimitOptions) => {
  return NODE_ENV === 'testing' ? options : {};
};
