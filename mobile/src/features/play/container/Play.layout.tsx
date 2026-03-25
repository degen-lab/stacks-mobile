import type { UserProfile } from "@/api/user/types";
import { ScrollView, Text, useModal, colors } from "@/components/ui";
import { StackIcon } from "@/components/ui/icons/stack";
import { SparkleIcon } from "@/components/ui/icons/sparkle";
import { LeaderboardList } from "@/features/leaderboard/components/leaderboard-list";
import { Podium } from "@/features/leaderboard/components/podium";
import type { LeaderboardUser } from "@/features/leaderboard/types";
import {
  ChallengeCard,
  GameCard,
  MenuButton,
  PlayHelpModal,
  PowerUpsModal,
  SkinSelectorModal,
} from "@/features/play/components";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { HelpCircle } from "lucide-react-native";
import { RefObject } from "react";
import { Pressable, View } from "react-native";

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
  const { ref: playHelpModalRef, present: presentPlayHelp } = useModal();

  return (
    <ScrollView
      className="flex-1 bg-surface-tertiary"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
      }}
    >
      <View className="flex-row items-center gap-2 mb-3">
        <Text className="text-xl">Let&apos;s Play!</Text>
        <Pressable
          onPress={presentPlayHelp}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Play help"
          style={{
            width: 24,
            height: 24,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HelpCircle size={16} color={colors.secondary} />
        </Pressable>
      </View>
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
            icon={SparkleIcon}
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
      <PlayHelpModal
        modalRef={playHelpModalRef as React.RefObject<BottomSheetModal>}
      />
    </ScrollView>
  );
}
