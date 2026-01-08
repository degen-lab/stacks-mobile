import { useState } from "react";
import { TestIds } from "react-native-google-mobile-ads";

import { Button, Text, View } from "@/components/ui";
import useRewardedAd from "@/features/ads/hooks/useRewardedAd";
import { Env } from "@/lib/env";

const adUnitId = __DEV__ ? TestIds.REWARDED : Env.ANDROID_REWARDS_AD_MOBIN_KEY;

export default function RewardedAdTest() {
  const [rewardEarned, setRewardEarned] = useState<{
    amount: number;
    type: string;
  } | null>(null);

  const { loaded, loading, error, loadAd, showAd } = useRewardedAd({
    adUnitId,
    onEarnedReward: (reward) => {
      setRewardEarned({ amount: reward.amount, type: reward.type });
    },
  });

  return (
    <View className="p-4 bg-surface-primary rounded-lg">
      <Text className="text-xl font-bold mb-4">Rewarded Ad Test</Text>

      <View className="mb-4">
        <Text className="text-sm text-text-secondary mb-2">
          Ad Unit ID: {adUnitId}
        </Text>
        <Text className="text-xs text-text-tertiary">
          {__DEV__ ? "Using test ad unit" : "Using production ad unit"}
        </Text>
      </View>

      {error && (
        <View className="mb-4 p-3 bg-red-100 rounded">
          <Text className="text-red-600 text-sm">Error: {error}</Text>
        </View>
      )}

      {rewardEarned && (
        <View className="mb-4 p-3 bg-green-100 rounded">
          <Text className="text-green-600 text-sm font-semibold">
            Reward Earned!
          </Text>
          <Text className="text-green-700 text-xs mt-1">
            Amount: {rewardEarned.amount} {rewardEarned.type}
          </Text>
        </View>
      )}

      <View className="mb-4">
        <Text className="text-sm mb-2">Status:</Text>
        <View className="flex-row items-center gap-2">
          <View
            className={`w-3 h-3 rounded-full ${
              loaded
                ? "bg-green-500"
                : loading
                  ? "bg-yellow-500"
                  : "bg-gray-400"
            }`}
          />
          <Text className="text-sm">
            {loaded ? "Ready to show" : loading ? "Loading..." : "Not loaded"}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        <Button
          onPress={showAd}
          disabled={!loaded || loading}
          label={
            loading
              ? "Loading Ad..."
              : loaded
                ? "Show Rewarded Ad"
                : "Ad Not Ready"
          }
          variant="primaryNavbar"
        ></Button>

        <Button
          onPress={loadAd}
          disabled={loading}
          label="Reload Ad"
          variant="default"
        ></Button>
      </View>
    </View>
  );
}
