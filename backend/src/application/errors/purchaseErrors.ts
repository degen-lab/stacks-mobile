import { BaseError } from '../../shared/errors/baseError';

export class PurchaseNotFoundError extends BaseError {
  readonly statusCode = 404;
  readonly name = 'PurchaseNotFoundError';

  constructor(message = 'Purchase not found') {
    super(message);
  }
}

export class InvalidWebhookPayloadError extends BaseError {
  readonly statusCode = 400;
  readonly name = 'InvalidWebhookPayloadError';

  constructor(message = 'Invalid webhook payload') {
    super(message);
  }
}

export class InvalidClientIpError extends BaseError {
  readonly statusCode = 400;
  readonly name = 'InvalidClientIpError';

  constructor(message = 'x-user-ip must be a valid IPv4 or IPv6 address') {
    super(message);
  }
}

export class TransakApiError extends BaseError {
  readonly statusCode = 502;
  readonly name = 'TransakApiError';

  constructor(
    message: string,
    public readonly transakStatusCode?: number,
    public readonly transakError?: unknown,
  ) {
    super(message);
  }
}
