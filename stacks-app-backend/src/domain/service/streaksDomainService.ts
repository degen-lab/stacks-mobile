import { DailyStreakChallenge } from '../../shared/types';
import { dailyChallenges } from '../helpers/challenges';

export class StreaksDomainService {
  constructor(private challenges: DailyStreakChallenge[] = dailyChallenges) {}

  chooseRandomChallenge(): DailyStreakChallenge {
    return this.challenges[Math.floor(Math.random() * this.challenges.length)];
  }
}
