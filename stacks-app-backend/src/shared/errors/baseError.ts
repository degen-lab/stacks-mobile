export abstract class BaseError extends Error {
  abstract readonly name: string;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class ConfigNotSetError extends BaseError {
  readonly name = 'ConfigNotSetError';
  readonly statusCode: number = 500;

  constructor(message: string) {
    super(message);
  }
}
