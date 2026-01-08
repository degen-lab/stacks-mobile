import type { TournamentStatusEnum } from "@/lib/enums";

export type SubmissionTier = "Gold" | "Silver" | "Bronze";

export type TournamentLeaderboardUser = {
  id: number;
  googleId: string;
  nickName: string;
  points: number;
  streak: number;
  lastStreakCompletionDate: string | null;
  createdAt: string;
  referralCode: string;
  isBlackListed: boolean;
  photoUri: string | null;
};

export type Submission = {
  id: number;
  transactionId: string;
  type: number;
  stacksAddress: string;
  createdAt: string;
  score: number;
  tournamentId: number;
  tier: number; // 0 = gold, 1 = silver, 2 = bronze, 3 = no tier
  user: TournamentLeaderboardUser | null;
  transactionStatus: number;
  serializedTx: string | null;
  adWatched: boolean;
  isSponsored: boolean;
};

export type LeaderboardData = {
  gold: Submission[];
  silver: Submission[];
  bronze: Submission[];
  top: Submission[];
  userPosition: number | null;
  userSubmission: Submission | null;
};

export type TournamentLeaderboardResponse = {
  success: boolean;
  message: string;
  data: LeaderboardData;
};

export type TournamentData = {
  tournamentId: number;
  status: TournamentStatusEnum;
};

export type TournamentDataResponse = {
  success: boolean;
  message: string;
  data: TournamentData;
};

export type CurrentTournamentSubmissions = {
  weeklyContestSubmissionsForCurrentTournament: Submission[];
  raffleSubmissionsForCurrentTournament: Submission[];
};

export type CurrentTournamentSubmissionsResponse = {
  success: boolean;
  message: string;
  data: CurrentTournamentSubmissions;
};
