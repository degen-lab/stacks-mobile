import {
  DailyStreakChallenge,
  SessionValidationResult,
} from '../../shared/types';

export const dailyChallenges: DailyStreakChallenge[] = [
  {
    id: 1,
    description: 'Pass at least 10 blocks in a single session',
    validator: (result: SessionValidationResult) => result.blocksPassed >= 10,
  },
  {
    id: 2,
    description: 'Score at least 500 points',
    validator: (result: SessionValidationResult) => result.score >= 500,
  },
  {
    id: 3,
    description: 'Play for at least 60 seconds',
    validator: (result: SessionValidationResult) => result.timePlayed >= 60,
  },
  {
    id: 4,
    description: 'Pass 20 blocks and score at least 1000 points',
    validator: (result: SessionValidationResult) =>
      result.blocksPassed >= 20 && result.score >= 1000,
  },
  {
    id: 5,
    description: 'Pass 5 blocks in under 30 seconds',
    validator: (result: SessionValidationResult) =>
      result.blocksPassed >= 5 && result.timePlayed <= 30,
  },
  {
    id: 6,
    description: 'Score at least 2000 points',
    validator: (result: SessionValidationResult) => result.score >= 2000,
  },
  {
    id: 7,
    description: 'Pass at least 15 blocks',
    validator: (result: SessionValidationResult) => result.blocksPassed >= 15,
  },
  {
    id: 8,
    description: 'Play for at least 2 minutes (120 seconds)',
    validator: (result: SessionValidationResult) => result.timePlayed >= 120,
  },
  {
    id: 9,
    description: 'Score at least 3000 points in one session',
    validator: (result: SessionValidationResult) => result.score >= 3000,
  },
  {
    id: 10,
    description: 'Pass 25 blocks and play for at least 90 seconds',
    validator: (result: SessionValidationResult) =>
      result.blocksPassed >= 25 && result.timePlayed >= 90,
  },
  {
    id: 11,
    description: 'Score at least 1500 points in under 2 minutes',
    validator: (result: SessionValidationResult) =>
      result.score >= 1500 && result.timePlayed <= 120,
  },
  {
    id: 12,
    description: 'Pass at least 30 blocks',
    validator: (result: SessionValidationResult) => result.blocksPassed >= 30,
  },
  {
    id: 13,
    description: 'Play for at least 3 minutes (180 seconds)',
    validator: (result: SessionValidationResult) => result.timePlayed >= 180,
  },
  {
    id: 14,
    description: 'Score at least 5000 points',
    validator: (result: SessionValidationResult) => result.score >= 5000,
  },
  {
    id: 15,
    description: 'Pass 10 blocks in under 45 seconds',
    validator: (result: SessionValidationResult) =>
      result.blocksPassed >= 10 && result.timePlayed <= 45,
  },
  {
    id: 16,
    description: 'Score at least 1000 points and pass 15 blocks',
    validator: (result: SessionValidationResult) =>
      result.score >= 1000 && result.blocksPassed >= 15,
  },
  {
    id: 17,
    description: 'Pass at least 40 blocks',
    validator: (result: SessionValidationResult) => result.blocksPassed >= 40,
  },
  {
    id: 18,
    description: 'Score at least 2500 points in under 3 minutes',
    validator: (result: SessionValidationResult) =>
      result.score >= 2500 && result.timePlayed <= 180,
  },
  {
    id: 19,
    description: 'Play for at least 4 minutes (240 seconds)',
    validator: (result: SessionValidationResult) => result.timePlayed >= 240,
  },
  {
    id: 20,
    description: 'Pass 20 blocks and score at least 30 points',
    validator: (result: SessionValidationResult) =>
      result.blocksPassed >= 20 && result.score >= 30,
  },
  {
    id: 21,
    description: 'Score at least 7500 points',
    validator: (result: SessionValidationResult) => result.score >= 7500,
  },
  {
    id: 22,
    description: 'Pass at least 50 blocks',
    validator: (result: SessionValidationResult) => result.blocksPassed >= 50,
  },
  {
    id: 23,
    description: 'Pass 15 blocks in under 60 seconds',
    validator: (result: SessionValidationResult) =>
      result.blocksPassed >= 15 && result.timePlayed <= 60,
  },
  {
    id: 24,
    description: 'Score at least 4000 points and play for at least 2 minutes',
    validator: (result: SessionValidationResult) =>
      result.score >= 4000 && result.timePlayed >= 120,
  },
  {
    id: 25,
    description: 'Pass at least 35 blocks and score at least 3000 points',
    validator: (result: SessionValidationResult) =>
      result.blocksPassed >= 35 && result.score >= 3000,
  },
  {
    id: 26,
    description: 'Play for at least 5 minutes (300 seconds)',
    validator: (result: SessionValidationResult) => result.timePlayed >= 300,
  },
  {
    id: 27,
    description: 'Score at least 10000 points',
    validator: (result: SessionValidationResult) => result.score >= 10000,
  },
  {
    id: 28,
    description: 'Pass at least 60 blocks',
    validator: (result: SessionValidationResult) => result.blocksPassed >= 60,
  },
  {
    id: 29,
    description: 'Pass 25 blocks in under 90 seconds',
    validator: (result: SessionValidationResult) =>
      result.blocksPassed >= 25 && result.timePlayed <= 90,
  },
  {
    id: 30,
    description: 'Score at least 6000 points in under 4 minutes',
    validator: (result: SessionValidationResult) =>
      result.score >= 6000 && result.timePlayed <= 240,
  },
];
