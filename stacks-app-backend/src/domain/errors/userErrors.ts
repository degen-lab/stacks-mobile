import { BaseError } from '../../shared/errors/baseError';

export class InvalidAmountError extends BaseError {
  readonly name = 'InvalidAmountError';
  readonly statusCode = 400;

  constructor(message = "Can't increment data with an negative amount") {
    super(message);
  }
}
