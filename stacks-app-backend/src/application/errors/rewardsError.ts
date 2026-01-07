import { BaseError } from '../../shared/errors/baseError';

export class TournamentStatusNotFoundError extends BaseError {
  readonly name = 'TournamentStatusNotFoundError';
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
  }
}
