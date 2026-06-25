import { FastifyRequest } from 'fastify';
import { getClientIp } from '../../../src/api/helpers/clientIp';

const requestWith = (
  headers: FastifyRequest['headers'],
  ip: string,
): FastifyRequest =>
  ({
    headers,
    ip,
  }) as FastifyRequest;

describe('getClientIp', () => {
  it('uses Cloudflare client IP first', () => {
    expect(
      getClientIp(
        requestWith(
          {
            'cf-connecting-ip': '203.0.113.10',
            'x-forwarded-for': '203.0.113.20',
          },
          '203.0.113.30',
        ),
      ),
    ).toBe('203.0.113.10');
  });

  it('uses the first forwarded IP when Cloudflare header is absent', () => {
    expect(
      getClientIp(
        requestWith(
          {
            'x-forwarded-for': '203.0.113.20, 203.0.113.21',
          },
          '203.0.113.30',
        ),
      ),
    ).toBe('203.0.113.20');
  });

  it('falls back to the request IP', () => {
    expect(getClientIp(requestWith({}, '203.0.113.30'))).toBe('203.0.113.30');
  });

  it('rejects invalid IP values', () => {
    expect(() =>
      getClientIp(
        requestWith(
          {
            'cf-connecting-ip': 'not-an-ip',
            'x-forwarded-for': 'also-not-an-ip',
          },
          'still-not-an-ip',
        ),
      ),
    ).toThrow('x-user-ip must be a valid IPv4 or IPv6 address');
  });
});
