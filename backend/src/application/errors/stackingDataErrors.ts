import { BaseError } from '../../shared/errors/baseError';

export class WrongStackingFunctionError extends BaseError {
  readonly statusCode = 400;
  readonly name: string = 'WRONG_STACKING_FUNCTION_ERROR';
  constructor(message: string) {
    super(message);
  }
}
