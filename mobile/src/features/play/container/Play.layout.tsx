import type { UserProfile } from "@/api/user/types";
import { ScrollView, Text } from "@/components/ui";
import { StackIcon } from "@/components/ui/icons/stack";
import { StarIcon } from "@/components/ui/icons/star";
import { LeaderboardList } from "@/features/leaderboard/components/leaderboard-list";
import { Podium } from "@/features/leaderboard/components/podium";
import type { LeaderboardUser } from "@/features/leaderboard/types";
import {
  ChallengeCard,
  GameCard,
  MenuButton,
  PowerUpsModal,
  SkinSelectorModal,
} from "@/features/play/components";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RefObject } from "react";
import { View } from "react-native";

interface PlayLayoutProps {
  dailyStreakDescription: string;
  userProfile?: Pick<
    UserProfile,
    "lastStreakCompletionDate" | "streak" | "points"
  >;
  submittedHighscore: number | null;
  weeklyContestSubmissions?: number;
  podiumUsers: LeaderboardUser[];
  leaderboardUsers: LeaderboardUser[];
  currentUserRank?: number | null;
  skinSelectorModalRef: RefObject<BottomSheetModal | null>;
  powerUpsModalRef: RefObject<BottomSheetModal | null>;
  onNavigateToStacksBridge: () => void;
  onOpenSkinSelector: () => void;
  onOpenPowerUps: () => void;
}

export function PlayLayout({
  dailyStreakDescription,
  userProfile,
  submittedHighscore,
  weeklyContestSubmissions,
  podiumUsers,
  leaderboardUsers,
  currentUserRank,
  skinSelectorModalRef,
  powerUpsModalRef,
  onNavigateToStacksBridge,
  onOpenSkinSelector,
  onOpenPowerUps,
}: PlayLayoutProps) {
  return (
    <ScrollView className="flex-1 bg-surface-tertiary px-4 pt-5">
      <Text className="text-xl mb-3">Let&apos;s Play!</Text>
      <GameCard
        title="Stacks Bridge"
        highscore={submittedHighscore ?? 0}
        submissions={weeklyContestSubmissions ?? 0}
        onPressPlay={onNavigateToStacksBridge}
      />
      <View className="flex flex-row gap-2 mt-2">
        <View className="flex-1">
          <MenuButton
            label="Power-ups"
            icon={StarIcon}
            onPress={onOpenPowerUps}
          />
        </View>
        <View className="flex-1">
          <MenuButton
            label="Skins"
            icon={StackIcon}
            onPress={onOpenSkinSelector}
          />
        </View>
      </View>
      <View className="mt-3">
        <ChallengeCard
          challengeDescription={dailyStreakDescription}
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
          currentUserRank={currentUserRank}
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
