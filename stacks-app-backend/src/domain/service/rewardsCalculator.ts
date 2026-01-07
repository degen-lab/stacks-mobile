import { Submission } from '../entities/submission';
import { MAX_REWARDED, TUNNING_CONSTANT } from '../helpers/constants';
import { logger } from '../../api/helpers/logger';

export class RewardsCalculator {
  // this submission has to be the unique per user, basically the submission with the biggest score of a user for that contest
  computeThreshold(submissions: Submission[]) {
    submissions.sort((a, b) => b.score - a.score);

    const uniqueUsers = submissions.length;

    if (uniqueUsers === 0) {
      throw new Error('Cannot compute thresholds for empty submissions array');
    }

    const sqrtCalculation = TUNNING_CONSTANT * Math.sqrt(uniqueUsers);
    const floorSqrt = Math.floor(sqrtCalculation);
    const rewardedUsersCount = Math.min(uniqueUsers, MAX_REWARDED, floorSqrt);
    const goldCount = Math.max(Math.floor((rewardedUsersCount * 1) / 6), 1);
    const silverCount = Math.max(
      goldCount + Math.floor((rewardedUsersCount * 2) / 6),
      1,
    );
    // bronzeCount should equal rewardedUsersCount to reward all eligible users
    // Calculate bronze slice end index to include all remaining users
    let bronzeCount = Math.max(
      silverCount + Math.floor((rewardedUsersCount * 3) / 6),
      1,
    );

    // Ensure bronzeCount equals rewardedUsersCount (all eligible users should be rewarded)
    if (bronzeCount < rewardedUsersCount) {
      bronzeCount = rewardedUsersCount;
    }

    logger.info({
      msg: 'RewardsCalculator: Computing thresholds',
      uniqueUsers,
      maxRewarded: MAX_REWARDED,
      tuningConstant: TUNNING_CONSTANT,
      sqrtCalculation,
      floorSqrt,
      rewardedUsersCount,
      goldCount,
      silverCount,
      bronzeCount,
      totalRewarded: bronzeCount,
      goldUsers: goldCount,
      silverUsers: silverCount - goldCount,
      bronzeUsers: bronzeCount - silverCount,
    });

    // bronzeCount is the cumulative end index, so it represents the total number of rewarded users
    // Check if we're trying to reward more users than we have
    if (bronzeCount > rewardedUsersCount) {
      throw new Error(
        `Bronze count (${bronzeCount}) is greater than rewarded users count (${rewardedUsersCount})`,
      );
    }

    const gold = submissions.slice(0, goldCount);
    const silver = submissions.slice(goldCount, silverCount);
    const bronze = submissions.slice(silverCount, bronzeCount);

    logger.info({
      msg: 'RewardsCalculator: Tier breakdown',
      gold: {
        count: gold.length,
        scores: gold.map((s) => ({
          id: s.id,
          score: s.score,
          address: s.stacksAddress,
        })),
        minScore: gold.length > 0 ? gold[gold.length - 1].score : null,
        maxScore: gold.length > 0 ? gold[0].score : null,
      },
      silver: {
        count: silver.length,
        scores: silver.map((s) => ({
          id: s.id,
          score: s.score,
          address: s.stacksAddress,
        })),
        minScore: silver.length > 0 ? silver[silver.length - 1].score : null,
        maxScore: silver.length > 0 ? silver[0].score : null,
      },
      bronze: {
        count: bronze.length,
        scores: bronze.map((s) => ({
          id: s.id,
          score: s.score,
          address: s.stacksAddress,
        })),
        minScore: bronze.length > 0 ? bronze[bronze.length - 1].score : null,
        maxScore: bronze.length > 0 ? bronze[0].score : null,
      },
    });

    return {
      gold,
      silver,
      bronze,
    };
  }
}
