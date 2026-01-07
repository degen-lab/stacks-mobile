import { BaseError } from '../../shared/errors/baseError';

export class NicknameNotProvidedError extends BaseError {
  readonly statusCode = 400;
  readonly name = 'NicknameNotProvidedError';

  constructor(message = 'User nickname not provided for registration') {
    super(message);
  }
}

export class UserNotFoundError extends BaseError {
  readonly statusCode = 400;
  readonly name = 'UserNotFoundError';

  constructor(message: string) {
    super(message);
  }
}

export class UserBlackListedError extends BaseError {
  readonly statusCode = 400;
  readonly name = 'UserBlackListedError';

  constructor(message = 'User is blacklisted') {
    super(message);
  }
}
