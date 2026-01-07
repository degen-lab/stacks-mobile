import { BaseError } from '../../shared/errors/baseError';

export class TransactionNotFoundError extends BaseError {
  readonly name = 'TransactionNotFoundError';
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
  }
}

export class TransactionAlreadySubmittedError extends BaseError {
  readonly name = 'TransactionAlreadySubmittedError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class TransactionPendingError extends BaseError {
  readonly name = 'TransactionPendingError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class SubmissionPhaseFinishedError extends BaseError {
  readonly name = 'SubmissionPhaseFinishedError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class AdNotWatchedError extends BaseError {
  readonly name = 'AdNotWatchedError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class SubmissionNotFoundError extends BaseError {
  readonly name = 'SubmissionNotFoundError';
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
  }
}

export class AdAlreadyWatchedError extends BaseError {
  readonly name = 'AdAlreadyWatchedError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class InvalidAdMobSignatureError extends BaseError {
  readonly name = 'InvalidAdMobSignatureError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class TransactionNotSponsoredError extends BaseError {
  readonly name = 'TransactionNotSponsoredError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

export class CannotDeleteSubmittedTransactionError extends BaseError {
  readonly name = 'CannotDeleteSubmittedTransactionError';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}
