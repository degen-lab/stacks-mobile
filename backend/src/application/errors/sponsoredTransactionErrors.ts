import { BaseError } from '../../shared/errors/baseError';

export class SponsoredTransactionNotFoundError extends BaseError {
  readonly name = 'SponsoredTransactionNotFoundError';
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
  }
}

export class SponsoredTransactionForbiddenError extends BaseError {
  readonly name = 'SponsoredTransactionForbiddenError';
  readonly statusCode = 403;

  constructor(message: string) {
    super(message);
  }
}

export class SponsoredTransactionExpiredError extends BaseError {
  readonly name = 'SponsoredTransactionExpiredError';
  readonly statusCode = 410;

  constructor(message: string) {
    super(message);
  }
}

export class UnsupportedSponsoredTransactionError extends BaseError {
  readonly name = 'UnsupportedSponsoredTransactionError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
