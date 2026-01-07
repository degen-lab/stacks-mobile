import { BaseError } from '../../shared/errors/baseError';

export class InvalidSeedError extends BaseError {
  readonly name = 'InvalidSeedError';
  readonly statusCode = 400;

  constructor(message = 'Invalid seed') {
    super(message);
  }
}
