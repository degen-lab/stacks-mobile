import { RotateCcw } from "lucide-react-native";

import { useSponsoredSubmissionsLeft, useUserProfile } from "@/api/user";
import { Button, Text, View, CardGradientRight } from "@/components/ui";
import colors from "@/components/ui/colors";
import { TrophyIcon } from "@/components/ui/icons/trophy-icon";
import { calculateStreakStats } from "@/lib/streak";
import PanelWrapper from "./PanelWrapper";
import RaffleSubmission from "./RaffleSubmission";
import type { ActionHandler, RunSummary } from "./types";

type GameOverOverlayProps = {
  summary: RunSummary;
  highScore?: number;
  onRestart: ActionHandler;
  onSubmitToLeaderboard?: ActionHandler;
  onSubmitToRaffle?: ActionHandler;
  onExit?: ActionHandler;
};

export default function GameOverOverlay({
  summary,
  highScore,
  onRestart,
  onSubmitToLeaderboard,
  onSubmitToRaffle,
  onExit,
}: GameOverOverlayProps) {
  const { data: userProfile } = useUserProfile();
  const { data: sponsoredSubmissionsLeft } = useSponsoredSubmissionsLeft();
  const raffleSubmissionsLeft =
    sponsoredSubmissionsLeft?.dailyRaffleSubmissionsLeft ?? 0;
  const hasRaffleEntries = raffleSubmissionsLeft > 0;
  const canSubmitToRaffle =
    hasRaffleEntries && summary.canSubmitScore && !summary.submittedRaffle;
  const highscoreSubmitted = summary.submittedHighscore;
  const canSubmitScore = summary.canSubmitScore;
  const submitStatusMessage = summary.submittedRaffle
    ? "Already submitted this run."
    : canSubmitScore
      ? undefined
      : "Submit Phase not started.";

  const dailyStreak = summary.streak ?? userProfile?.streak ?? 0;
  const streakStats = calculateStreakStats({ streak: dailyStreak });
  const boostRate = streakStats.boostPercentage / 100;
  const basePoints = summary.baseScore;
  const calculatedBonus =
    Math.floor(basePoints + basePoints * boostRate) - basePoints;
  const streakBonus =
    summary.pointsEarned !== undefined
      ? Math.max(0, summary.pointsEarned - basePoints)
      : calculatedBonus;
  return (
    <PanelWrapper>
      <View className="w-full flex-col items-center gap-4">
        <View className="items-center">
          <Text className="text-base font-instrument-sans uppercase tracking-widest text-secondary dark:text-sand-300">
            {summary.isHighScore ? "NEW HIGHSCORE" : "Score"}
          </Text>
          <Text className="font-matter text-7xl text-primary dark:text-white leading-tight">
            {summary.score}
          </Text>
        </View>
        {!summary.isHighScore && highScore !== undefined ? (
          <View className="w-full rounded-xl border border-surface-secondary bg-sand-100 p-4">
            <View className="flex-row items-center gap-2">
              <TrophyIcon size={20} color={colors.neutral[900]} />
              <Text className="text-sm text-secondary dark:text-sand-300">
                Only{" "}
                <Text className="font-semibold">
                  {Math.max(1, highScore - summary.score + 10)}
                </Text>{" "}
                more to set a new highscore.
              </Text>
            </View>
          </View>
        ) : null}
        {onSubmitToLeaderboard && summary.isHighScore ? (
          <Button
            onPress={onSubmitToLeaderboard}
            variant="gamePrimary"
            size="game"
            className="w-full"
            label={
              !canSubmitScore
                ? "Submit Phase not started"
                : highscoreSubmitted
                  ? "Submitted Highscore"
                  : "Submit your highscore"
            }
            leftIcon={
              canSubmitScore && (
                <TrophyIcon
                  size={18}
                  color={highscoreSubmitted ? colors.neutral[900] : "#fff"}
                />
              )
            }
            disabled={highscoreSubmitted || !canSubmitScore}
          />
        ) : null}

        <View className="mb-4 w-full flex-row gap-3">
          <CardGradientRight
            label="Points"
            value={basePoints}
            gradient="bitcoin"
            labelPosition="top"
          />
          <CardGradientRight
            label="Streak Bonus"
            value={`+${streakBonus}`}
            gradient="blood-orange"
            labelPosition="top"
          />
        </View>

        {hasRaffleEntries ? (
          <RaffleSubmission
            canSubmit={canSubmitToRaffle}
            sponsoredSubmissionsLeft={raffleSubmissionsLeft}
            statusMessage={submitStatusMessage}
            onSubmit={onSubmitToRaffle}
          />
        ) : null}

        <View className="w-full flex-row gap-3">
          {onExit ? (
            <Button
              onPress={onExit}
              variant="gameOutline"
              size="game"
              label="Exit"
              className="flex-1"
            />
          ) : null}
          <Button
            onPress={onRestart}
            variant="gamePrimary"
            size="game"
            label="Play again"
            leftIcon={<RotateCcw size={18} color="#fff" />}
            className={onExit ? "flex-1" : "w-full"}
          />
        </View>
      </View>
    </PanelWrapper>
  );
}
