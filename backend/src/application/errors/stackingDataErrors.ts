import { extend } from 'zod/v4/core/util.cjs';
import { BaseError } from '../../shared/errors/baseError';

export class WrongStackingFunctionError extends BaseError {
  readonly statusCode = 400;
  readonly name: string = 'WRONG_STACKING_FUNCTION_ERROR';
  constructor(message: string) {
    super(message);
  }
}

export class StackingDataNotFoundError extends BaseError {
  readonly statusCode: number = 400;
  readonly name: string = 'STACKING_DATA_NOT_FOUND_ERROR';

  constructor(message: string) {
    super(message);
  }
}

export class RewardFolderRefNotCached extends BaseError {
  readonly statusCode: number = 400;
  readonly name: string = 'REWARD_FOLDER_REF_NOT_CACHED';

  constructor(message: string) {
    super(message);
  }
}
