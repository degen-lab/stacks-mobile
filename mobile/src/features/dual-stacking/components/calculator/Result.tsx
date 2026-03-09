import { useWindowDimensions } from "react-native";

import { Skeleton, View } from "@/components/ui";
import { SbtcIcon } from "@/components/ui/icons";
import { Text } from "@/components/ui/text";

type ProjectRewardsResultProps = {
  totalApr: number;
  rewardsSbtc?: number;
  rewardsUsd?: number;
  isLoading?: boolean;
  isError?: boolean;
};

const formatPercent = (value?: number) => {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${value.toFixed(2)}%`;
};

const formatSbtc = (value?: number) => {
  if (value == null || Number.isNaN(value)) return "0.000000 sBTC";
  return `${value.toFixed(6)} sBTC`;
};

export function ProjectRewardsResult({
  totalApr,
  rewardsSbtc,
  rewardsUsd,
  isLoading = false,
  isError = false,
}: ProjectRewardsResultProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 480;

  if (isError) {
    return (
      <View className="rounded-xl bg-surface-secondary p-4">
        <Text className="font-instrument-sans-medium text-sm text-red-500">
          Unable to calculate projected rewards. Try adjusting your inputs.
        </Text>
      </View>
    );
  }

  return (
    <View
      className={`rounded-xl bg-sand-100 p-3 ${
        isWide ? "flex-row items-center justify-evenly gap-4" : "flex-col gap-4"
      }`}
    >
      <View className="items-center justify-center gap-1">
        <Text className="font-instrument-sans-medium text-[12px] leading-4 tracking-[0.12px] text-secondary">
          Estimated annual rewards
        </Text>
        {isLoading ? (
          <Skeleton className="h-6 w-24 rounded-sm" />
        ) : (
          <Text className="font-instrument-sans-medium text-[18px] leading-6 text-primary">
            {formatPercent(totalApr)} APY
          </Text>
        )}
      </View>

      <View className="items-center justify-center gap-1 rounded-[8px] bg-surface-primary px-4 py-2">
        <View className="flex-row items-center gap-1">
          <SbtcIcon width={16} height={16} />
          {isLoading ? (
            <Skeleton className="h-6 w-28 rounded-sm" />
          ) : (
            <Text className="font-instrument-sans-medium text-base leading-6 text-primary">
              {formatSbtc(rewardsSbtc)}
            </Text>
          )}
        </View>
        {isLoading ? (
          <Skeleton className="h-4 w-24 rounded-sm" />
        ) : (
          <Text className="font-instrument-sans-medium text-xs leading-4 text-tertiary">
            {rewardsUsd != null ? `($${rewardsUsd.toFixed(2)})` : "--"}
          </Text>
        )}
      </View>
    </View>
  );
}
