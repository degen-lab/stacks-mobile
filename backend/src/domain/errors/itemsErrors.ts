import { BaseError } from '../../shared/errors/baseError';

export class InsuficientQuantityError extends BaseError {
  readonly name = 'InsuficientQuantityError';
  readonly statusCode = 400;

  constructor(message = 'You do not have enough quantity of this item') {
    super(message);
  }
}
