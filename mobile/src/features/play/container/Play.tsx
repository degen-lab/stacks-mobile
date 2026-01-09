import { useDailyStreak } from "@/api/game/session/use-daily-streak";
import {
  useCurrentTournamentSubmissions,
  useTournamentLeaderboard,
} from "@/api/tournament";
import { useUserProfile } from "@/api/user";
import {
  buildLeaderboardUsers,
  buildPodiumUsers,
} from "@/features/leaderboard/utils";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import { PlayLayout } from "./Play.layout";

export default function PlayScreen() {
  const router = useRouter();
  const { data: dailyStreakData } = useDailyStreak();
  const { data: userProfile } = useUserProfile();
  const { data: leaderboardData } = useTournamentLeaderboard();
  const { data: currentTournamentSubmissions } =
    useCurrentTournamentSubmissions();
  const skinSelectorModalRef = useRef<BottomSheetModal>(null);
  const powerUpsModalRef = useRef<BottomSheetModal>(null);

  const podiumUsers = useMemo(
    () => buildPodiumUsers(leaderboardData),
    [leaderboardData],
  );

  const leaderboardUsers = useMemo(
    () => buildLeaderboardUsers(leaderboardData),
    [leaderboardData],
  );

  const submittedHighscore = leaderboardData?.userSubmission?.score ?? null;
  const weeklyContestSubmissions =
    currentTournamentSubmissions?.weeklyContestSubmissionsForCurrentTournament
      .length;
  const navigateToStacksBridge = () => {
    router.push("/stacks-bridge");
  };

  const openSkinSelector = () => {
    skinSelectorModalRef.current?.present();
  };

  const openPowerUps = () => {
    powerUpsModalRef.current?.present();
  };

  return (
    <PlayLayout
      dailyStreakDescription={dailyStreakData?.description ?? ""}
      userProfile={userProfile}
      submittedHighscore={submittedHighscore}
      weeklyContestSubmissions={weeklyContestSubmissions}
      podiumUsers={podiumUsers}
      leaderboardUsers={leaderboardUsers}
      currentUserRank={leaderboardData?.userPosition}
      skinSelectorModalRef={skinSelectorModalRef}
      powerUpsModalRef={powerUpsModalRef}
      onNavigateToStacksBridge={navigateToStacksBridge}
      onOpenSkinSelector={openSkinSelector}
      onOpenPowerUps={openPowerUps}
    />
  );
}
