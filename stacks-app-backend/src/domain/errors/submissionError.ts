import { BaseError } from '../../shared/errors/baseError';

export class DailySponsoredRaffleSubmissionNumberMetError extends BaseError {
  readonly name = 'DailySponsoredRaffleSubmissionNumberMetError';
  readonly statusCode = 400;

  constructor(message = 'Daily sponsored raffle submission number met') {
    super(message);
  }
}

export class InvalidStacksAddressError extends BaseError {
  readonly name = 'InvalidStacksAddressError';
  readonly statusCode = 400;

  constructor(message = 'Invalid Stacks address. Address must start with ST') {
    super(message);
  }
}

export class DailySponsoredWeeklyContestSubmissionNumberMetError extends BaseError {
  readonly name = 'DailySponsoredWeeklyContestSubmissionNumberMetError';
  readonly statusCode = 400;

  constructor(
    message = 'Daily sponsored weekly contest submission number met',
  ) {
    super(message);
  }
}
