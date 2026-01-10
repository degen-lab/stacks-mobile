import { LinearGradient } from "expo-linear-gradient";
import { Heart, Video } from "lucide-react-native";

import {
  ActivityIndicator,
  OverlayPanel,
  Pressable,
  Text,
  View,
} from "@/components/ui";
import colors from "@/components/ui/colors";
import { getDisplayScore, getBaseScore } from "../../utils/scoreCalculation";
import type { ActionHandler } from "../../types";

type ReviveOverlayProps = {
  score: number;
  highScore?: number;
  onRevive: ActionHandler;
  onDeclineRevive: ActionHandler;
  isWatchingAd: boolean;
  adLoaded: boolean;
  adLoading: boolean;
  adError: string | null;
};

export default function ReviveOverlay({
  score,
  highScore = 0,
  onRevive,
  onDeclineRevive,
  isWatchingAd,
  adLoaded,
  adLoading,
  adError,
}: ReviveOverlayProps) {
  const canCompareHighScore = highScore > 0;
  const newScore = getDisplayScore(score);
  const isHighScorePace = canCompareHighScore && newScore >= highScore;
  const bridgesLeft = getBaseScore(highScore - newScore) + 1;
  return (
    <OverlayPanel>
      <View className="w-full items-center gap-4">
        <View className="w-full items-center gap-3 rounded-2xl border border-sand-200 bg-white px-4 py-5 dark:bg-neutral-900 dark:border-neutral-800">
          <LinearGradient
            colors={["#FF8A64", colors.stacks.bloodOrange]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.stacks.bloodOrange,
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <Heart size={32} color="#fff" fill="#fff" />
          </LinearGradient>
          <View className="items-center">
            <Text className="text-lg font-semibold text-primary dark:text-white">
              Continue your run?
            </Text>
            <Text className="mt-1 text-center text-base leading-6 text-secondary dark:text-sand-300 font-instrument-sans">
              {isHighScorePace
                ? "You can keep going or submit highscore"
                : canCompareHighScore
                  ? `Only ${bridgesLeft} ${bridgesLeft === 1 ? "bridge" : "bridges"} left for a new record!`
                  : "Keep your streak alive and set a new high score."}
            </Text>
          </View>
        </View>

        {!isWatchingAd ? (
          <View className="w-full gap-2">
            {adError ? (
              <View className="rounded-xl bg-feedback-yellow-100 px-4 py-3">
                <Text className="text-xs text-feedback-yellow-700">
                  Ad unavailable. Tap again to retry.
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={onRevive}
              disabled={adLoading}
              className={`w-full flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3 ${
                adLoaded ? "bg-stacks-blood-orange" : "bg-sand-300"
              }`}
            >
              {adLoading ? (
                <ActivityIndicator size="small" className="text-white" />
              ) : (
                <Video size={18} color="#fff" />
              )}
              <Text className="text-base font-semibold text-white">
                {adLoading
                  ? "Loading ad..."
                  : adLoaded
                    ? "Keep going!"
                    : adError
                      ? "Retry"
                      : "Loading..."}
              </Text>
            </Pressable>
            <Pressable
              className="w-full items-center rounded-2xl border border-sand-300 px-4 py-3"
              onPress={onDeclineRevive}
            >
              <Text className="text-sm font-semibold text-secondary">
                End run
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="w-full items-center gap-2">
            <ActivityIndicator size="small" className="text-secondary" />
            <Text className="text-base font-semibold text-secondary">
              Watching ad to revive...
            </Text>
            <Text className="text-xs text-secondary">
              Keep the ad open to continue your run.
            </Text>
          </View>
        )}
      </View>
    </OverlayPanel>
  );
}
