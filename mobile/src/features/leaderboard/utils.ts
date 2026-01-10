import type { LeaderboardData, Submission } from "@/api/tournament";
import type { LeaderboardUser } from "@/features/leaderboard/types";

type Tier = LeaderboardUser["tier"];

const buildTierMap = (data: LeaderboardData): Map<number, Tier> => {
  const tierMap = new Map<number, Tier>();
  data.gold.forEach((submission) => tierMap.set(submission.id, "Gold"));
  data.silver.forEach((submission) => tierMap.set(submission.id, "Silver"));
  data.bronze.forEach((submission) => tierMap.set(submission.id, "Bronze"));
  return tierMap;
};

const getTier = (
  submissionId: number,
  rank: number,
  tierMap: Map<number, Tier>,
): Tier | undefined => {
  const tierFromMap = tierMap.get(submissionId);
  if (tierFromMap) return tierFromMap;

  if (rank === 1) return "Gold";
  if (rank === 2) return "Silver";
  if (rank === 3) return "Bronze";
  return undefined;
};

const toUser = (
  submission: Submission,
  tier: Tier | undefined,
  rank: number,
  isCurrentUser = false,
): LeaderboardUser => ({
  rank,
  name: submission.user?.nickName ?? "Anonymous",
  score: submission.score,
  photoUri: submission.user?.photoUri
    ? { uri: submission.user.photoUri }
    : undefined,
  tier,
  isCurrentUser,
});

export const buildPodiumUsers = (data?: LeaderboardData): LeaderboardUser[] => {
  if (!data) return [];

  const tierMap = buildTierMap(data);
  return data.top.slice(0, 3).map((submission, index) => {
    const rank = index + 1;
    const tier = getTier(submission.id, rank, tierMap);
    return toUser(submission, tier, rank);
  });
};

export const buildLeaderboardUsers = (
  data?: LeaderboardData,
  { windowSize = 8, excludeTop3 = true } = {},
): LeaderboardUser[] => {
  if (!data) return [];

  const tierMap = buildTierMap(data);
  const currentUserId = data.userSubmission?.user?.id;
  const userInTopArray = currentUserId
    ? data.top.some((s) => s.user?.id === currentUserId)
    : false;

  const skipCount = excludeTop3 && data.top.length >= 3 ? 3 : 0;

  let users = data.top.slice(skipCount).map((submission, i) => {
    const isCurrentUser = submission.user?.id === currentUserId;
    const rank = skipCount + i + 1;
    const tier = tierMap.get(submission.id);
    return toUser(submission, tier, rank, isCurrentUser);
  });

  if (currentUserId && data.userSubmission && !userInTopArray) {
    const currentUserEntry = toUser(
      data.userSubmission,
      tierMap.get(data.userSubmission.id),
      data.userPosition ?? 0,
      true,
    );
    users = [currentUserEntry, ...users];
  }

  return users.slice(0, windowSize);
};
