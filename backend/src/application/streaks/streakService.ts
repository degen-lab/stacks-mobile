import { EntityManager } from 'typeorm';
import { StreaksDomainService } from '../../domain/service/streaksDomainService';
import { DailyStreakChallenge } from '../../shared/types';
import { DailyStreakChallengeNotFoundError } from '../errors/streakErrors';
import { CachePort } from '../ports/cachePort';
import { User } from '../../domain/entities/user';
import { dailyChallenges } from '../../domain/helpers/challenges';

export class StreakService {
  constructor(
    private streakDomainService: StreaksDomainService,
    private cacheManager: CachePort,
    private entityManager: EntityManager,
  ) {}

  async getDailyStreak(): Promise<DailyStreakChallenge> {
    const cachedChallenge = await this.cacheManager.get<DailyStreakChallenge>(
      'dailyStreakChallenge',
    );
    if (!cachedChallenge) {
      throw new DailyStreakChallengeNotFoundError();
    }

    // Reconstruct the validator function since it's lost in JSON serialization
    // Find the matching challenge from dailyChallenges by description
    const fullChallenge = dailyChallenges.find(
      (c) => c.description === cachedChallenge.description,
    );

    if (!fullChallenge) {
      // If challenge not found, it might have been removed from the list
      // In this case, throw an error or use a default validator
      throw new DailyStreakChallengeNotFoundError(
        `Challenge with description "${cachedChallenge.description}" not found in challenges list`,
      );
    }

    // Return the challenge with the validator function attached
    return {
      id: cachedChallenge.id,
      description: cachedChallenge.description,
      validator: fullChallenge.validator,
    };
  }

  async setDailyStreak(): Promise<DailyStreakChallenge> {
    const newStreak = this.streakDomainService.chooseRandomChallenge();
    await this.cacheManager.set<DailyStreakChallenge>(
      'dailyStreakChallenge',
      newStreak,
    );
    return newStreak;
  }

  async resetUsersStreak(): Promise<void> {
    await this.entityManager.transaction(async (entityManager) => {
      const users = await entityManager.find(User);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      for (const user of users) {
        const previousStreak = user.streak;
        user.resetStreak(yesterday);
        if (user.streak !== previousStreak) {
          await entityManager.save(user);
        }
      }
    });
  }
}
