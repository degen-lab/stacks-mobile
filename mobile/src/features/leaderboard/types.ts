import type { ImageSource } from "expo-image";

export type LeaderboardUser = {
  rank: number;
  rankLabel?: string;
  name: string;
  score: number;
  scoreLabel?: string;
  photoUri?: ImageSource;
  tier?: "Gold" | "Silver" | "Bronze";
  isCurrentUser?: boolean;
};

export type PodiumUser = LeaderboardUser;
