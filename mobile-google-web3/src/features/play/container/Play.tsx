import { useDailyStreak } from "@/api/game/session/use-daily-streak";
import {
  useCurrentTournamentSubmissions,
  useTournamentLeaderboard,
} from "@/api/tournament";
import { useUserProfile } from "@/api/user";
import { ScrollView, Text } from "@/components/ui";
import { StackIcon } from "@/components/ui/icons/stack";
import { StarIcon } from "@/components/ui/icons/star";
import { LeaderboardList } from "@/features/leaderboard/components/LeaderboardList";
import { Podium } from "@/features/leaderboard/components/Podium";
import {
  buildLeaderboardUsers,
  buildPodiumUsers,
} from "@/features/leaderboard/utils";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useMemo, useRef } from "react";
import { View } from "react-native";
import DailyStreakCard from "../components/DailyStreakCard";
import GameCard from "../components/GameCard";
import MenuButton from "../components/MenuButton";
import { PowerUpsModal } from "../components/PowerUpsModal";
import { SkinSelectorModal } from "../components/SkinSelectorModal";

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
    <ScrollView className="flex-1 bg-surface-tertiary px-4 pt-5">
      <Text className="text-xl mb-3">Let&apos;s Play!</Text>
      <GameCard
        title="Stacks Bridge"
        highscore={submittedHighscore ?? 0}
        submissions={weeklyContestSubmissions ?? 0}
        onPressPlay={navigateToStacksBridge}
      />
      <View className="flex flex-row gap-2 mt-2">
        <View className="flex-1">
          <MenuButton
            label="Power-ups"
            icon={StarIcon}
            onPress={openPowerUps}
          />
        </View>
        <View className="flex-1">
          <MenuButton
            label="Skins"
            icon={StackIcon}
            onPress={openSkinSelector}
          />
        </View>
      </View>
      <View className="mt-3">
        <DailyStreakCard
          challengeDescription={dailyStreakData?.description as string}
          lastCompletionDate={userProfile?.lastStreakCompletionDate}
          currentStreak={userProfile?.streak}
        />
      </View>
      <View className="flex flex-row items-center justify-between pt-4">
        <Text className="text-xl mb-3">Leaderboard</Text>
      </View>
      <View className="">
        <Podium users={podiumUsers} />
      </View>
      <View className="">
        <LeaderboardList
          users={leaderboardUsers}
          currentUserRank={leaderboardData?.userPosition}
        />
      </View>
      <SkinSelectorModal
        ref={skinSelectorModalRef}
        availablePoints={userProfile?.points}
      />
      <PowerUpsModal ref={powerUpsModalRef} />
    </ScrollView>
  );
}
