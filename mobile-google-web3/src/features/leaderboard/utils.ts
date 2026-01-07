import type { LeaderboardData, Submission } from "@/api/tournament";
import type { LeaderboardUser } from "@/features/leaderboard/types";

type Tier = LeaderboardUser["tier"];

// we use this for top 3 podium
const getTierByRank = (rank: number): Tier | undefined => {
  if (rank === 1) return "Gold";
  if (rank === 2) return "Silver";
  if (rank === 3) return "Bronze";
  return undefined;
};

// we use this for leaderboard list to add trophy icons based on tier
const buildTierMap = (data: LeaderboardData) => {
  const tierBySubmissionId = new Map<number, Tier>();
  data.gold.forEach((submission) => {
    tierBySubmissionId.set(submission.id, "Gold");
  });
  data.silver.forEach((submission) => {
    tierBySubmissionId.set(submission.id, "Silver");
  });
  data.bronze.forEach((submission) => {
    tierBySubmissionId.set(submission.id, "Bronze");
  });
  return tierBySubmissionId;
};

const toUser = (
  submission: Submission,
  tier: Tier,
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
  const tierBySubmissionId = buildTierMap(data);
  return data.top.slice(0, 3).map((submission, index) => {
    const rank = index + 1;
    const tier = tierBySubmissionId.get(submission.id) ?? getTierByRank(rank);
    return toUser(submission, tier, rank);
  });
};

export const buildLeaderboardUsers = (
  data?: LeaderboardData,
  { windowSize = 8, excludeTop3 = true } = {},
): LeaderboardUser[] => {
  if (!data) return [];

  const tierBySubmissionId = buildTierMap(data);
  const shouldExcludeTop3 = excludeTop3 && data.top.length >= 3;
  const startIndex = shouldExcludeTop3 ? 3 : 0;
  const currentUserId = data.userSubmission?.user?.id;

  let users = data.top.slice(startIndex).map((submission, i) => {
    const isCurrentUser = submission.user?.id === currentUserId;
    const rank =
      isCurrentUser && data.userPosition
        ? data.userPosition
        : startIndex + i + 1;

    const tier = tierBySubmissionId.get(submission.id);
    return toUser(submission, tier, rank, isCurrentUser);
  });

  if (
    currentUserId &&
    data.userSubmission &&
    !data.top.some((submission) => submission.user?.id === currentUserId)
  ) {
    users = [
      toUser(
        data.userSubmission,
        tierBySubmissionId.get(data.userSubmission.id),
        data.userPosition ?? 0,
        true,
      ),
      ...users,
    ];
  }

  return users.slice(0, windowSize);
};
