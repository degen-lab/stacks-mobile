import { isIP } from 'node:net';
import { FastifyRequest } from 'fastify';
import { InvalidClientIpError } from '../../application/errors/purchaseErrors';

const firstHeader = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const validIp = (value: string | undefined) => {
  const candidate = value?.trim();
  return candidate && isIP(candidate) ? candidate : undefined;
};

export const getClientIp = (request: FastifyRequest): string => {
  const cloudflareIp = validIp(
    firstHeader(request.headers['cf-connecting-ip']),
  );
  if (cloudflareIp) return cloudflareIp;

  const forwardedFor = firstHeader(request.headers['x-forwarded-for']);
  const forwardedIp = validIp(forwardedFor?.split(',')[0]);
  if (forwardedIp) return forwardedIp;

  const requestIp = validIp(request.ip);
  if (requestIp) return requestIp;

  throw new InvalidClientIpError();
};
