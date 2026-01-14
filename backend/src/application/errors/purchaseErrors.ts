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
