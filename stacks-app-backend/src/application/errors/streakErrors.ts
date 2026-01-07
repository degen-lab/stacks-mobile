export class DailyStreakChallengeNotFoundError extends Error {
  readonly name = 'DailyStreakChallengeNotFoundError';
  readonly statusCode = 400;

  constructor(message = 'Daily streak challenge not found') {
    super(message);
  }
}
