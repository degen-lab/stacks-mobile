import type { LeaderboardData, Submission } from "@/api/tournament";

const createMockSubmission = (
  id: number,
  score: number,
  userId: number,
  nickName: string,
  photoUri?: string,
): Submission =>
  ({
    id,
    score,
    user: {
      id: userId,
      nickName,
      photoUri,
    },
  }) as Submission;

/**
 * Mock leaderboard data for visual testing
 * Includes:
 * - Top 3 users for podium
 * - Additional users for leaderboard list
 * - Current user at rank 15
 */
export const mockLeaderboardData: LeaderboardData = {
  top: [
    createMockSubmission(
      1,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
    createMockSubmission(
      2,
      1180,
      2,
      "StacksMaster",
      "https://i.pravatar.cc/150?u=2",
    ),
    createMockSubmission(
      3,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
    createMockSubmission(
      4,
      980,
      4,
      "SatoshiFan",
      "https://i.pravatar.cc/150?u=4",
    ),
    createMockSubmission(
      5,
      920,
      5,
      "Web3Warrior",
      "https://i.pravatar.cc/150?u=5",
    ),
    createMockSubmission(
      6,
      860,
      6,
      "DeFiDegen",
      "https://i.pravatar.cc/150?u=6",
    ),
    createMockSubmission(
      7,
      810,
      7,
      "BlockBuilder",
      "https://i.pravatar.cc/150?u=7",
    ),
    createMockSubmission(
      8,
      770,
      8,
      "ChainChamp",
      "https://i.pravatar.cc/150?u=8",
    ),
    createMockSubmission(
      9,
      720,
      9,
      "CryptoNinja",
      "https://i.pravatar.cc/150?u=9",
    ),
    createMockSubmission(
      10,
      680,
      10,
      "TokenTrader",
      "https://i.pravatar.cc/150?u=10",
    ),
    createMockSubmission(
      11,
      650,
      11,
      "NFTCollector",
      "https://i.pravatar.cc/150?u=11",
    ),
    createMockSubmission(
      12,
      620,
      12,
      "GasOptimizer",
      "https://i.pravatar.cc/150?u=12",
    ),
  ],
  gold: [
    createMockSubmission(
      1,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
  ],
  silver: [
    createMockSubmission(
      2,
      1180,
      2,
      "StacksMaster",
      "https://i.pravatar.cc/150?u=2",
    ),
  ],
  bronze: [
    createMockSubmission(
      3,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
  ],
  userSubmission: createMockSubmission(
    40,
    450,
    999,
    "You",
    "https://i.pravatar.cc/150?u=999",
  ),
  userPosition: 40,
};

/**
 * Mock data where current user is in top 3 (rank 2)
 */
export const mockLeaderboardDataUserInTop3: LeaderboardData = {
  top: [
    createMockSubmission(
      1,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
    createMockSubmission(
      2,
      1180,
      999,
      "You",
      "https://i.pravatar.cc/150?u=999",
    ),
    createMockSubmission(
      3,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
    createMockSubmission(
      4,
      980,
      4,
      "SatoshiFan",
      "https://i.pravatar.cc/150?u=4",
    ),
    createMockSubmission(
      5,
      920,
      5,
      "Web3Warrior",
      "https://i.pravatar.cc/150?u=5",
    ),
  ],
  gold: [
    createMockSubmission(
      1,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
  ],
  silver: [
    createMockSubmission(
      2,
      1180,
      999,
      "You",
      "https://i.pravatar.cc/150?u=999",
    ),
  ],
  bronze: [
    createMockSubmission(
      3,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
  ],
  userSubmission: createMockSubmission(
    2,
    1180,
    999,
    "You",
    "https://i.pravatar.cc/150?u=999",
  ),
  userPosition: 2,
};

/**
 * Mock data where current user is rank 1 (gold)
 */
export const mockLeaderboardDataUserRank1: LeaderboardData = {
  top: [
    createMockSubmission(
      1,
      1450,
      999,
      "You",
      "https://i.pravatar.cc/150?u=999",
    ),
    createMockSubmission(
      2,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
    createMockSubmission(
      3,
      1180,
      2,
      "StacksMaster",
      "https://i.pravatar.cc/150?u=2",
    ),
    createMockSubmission(
      4,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
  ],
  gold: [
    createMockSubmission(
      1,
      1450,
      999,
      "You",
      "https://i.pravatar.cc/150?u=999",
    ),
  ],
  silver: [
    createMockSubmission(
      2,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
  ],
  bronze: [
    createMockSubmission(
      3,
      1180,
      2,
      "StacksMaster",
      "https://i.pravatar.cc/150?u=2",
    ),
  ],
  userSubmission: createMockSubmission(
    1,
    1450,
    999,
    "You",
    "https://i.pravatar.cc/150?u=999",
  ),
  userPosition: 1,
};

/**
 * Mock data where current user has no submission yet
 */
export const mockLeaderboardDataNoUserSubmission: LeaderboardData = {
  top: [
    createMockSubmission(
      1,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
    createMockSubmission(
      2,
      1180,
      2,
      "StacksMaster",
      "https://i.pravatar.cc/150?u=2",
    ),
    createMockSubmission(
      3,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
    createMockSubmission(
      4,
      980,
      4,
      "SatoshiFan",
      "https://i.pravatar.cc/150?u=4",
    ),
    createMockSubmission(
      5,
      920,
      5,
      "Web3Warrior",
      "https://i.pravatar.cc/150?u=5",
    ),
  ],
  gold: [
    createMockSubmission(
      1,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
  ],
  silver: [
    createMockSubmission(
      2,
      1180,
      2,
      "StacksMaster",
      "https://i.pravatar.cc/150?u=2",
    ),
  ],
  bronze: [
    createMockSubmission(
      3,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
  ],
  userSubmission: null,
  userPosition: null,
};

/**
 * Mock data with only 2 users (edge case)
 */
export const mockLeaderboardDataFewUsers: LeaderboardData = {
  top: [
    createMockSubmission(
      1,
      500,
      1,
      "FirstPlayer",
      "https://i.pravatar.cc/150?u=1",
    ),
    createMockSubmission(
      2,
      300,
      2,
      "SecondPlayer",
      "https://i.pravatar.cc/150?u=2",
    ),
  ],
  gold: [],
  silver: [],
  bronze: [],
  userSubmission: createMockSubmission(
    2,
    300,
    2,
    "SecondPlayer",
    "https://i.pravatar.cc/150?u=2",
  ),
  userPosition: 2,
};

/**
 * Mock data with anonymous users
 */
export const mockLeaderboardDataAnonymous: LeaderboardData = {
  top: [
    createMockSubmission(
      1,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
    { id: 2, score: 1180, user: undefined } as unknown as Submission,
    createMockSubmission(
      3,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
    { id: 4, score: 980, user: undefined } as unknown as Submission,
    createMockSubmission(5, 920, 999, "You", "https://i.pravatar.cc/150?u=999"),
  ],
  gold: [
    createMockSubmission(
      1,
      1250,
      1,
      "CryptoKing",
      "https://i.pravatar.cc/150?u=1",
    ),
  ],
  silver: [],
  bronze: [
    createMockSubmission(
      3,
      1050,
      3,
      "BTCQueen",
      "https://i.pravatar.cc/150?u=3",
    ),
  ],
  userSubmission: createMockSubmission(
    5,
    920,
    999,
    "You",
    "https://i.pravatar.cc/150?u=999",
  ),
  userPosition: 5,
};
