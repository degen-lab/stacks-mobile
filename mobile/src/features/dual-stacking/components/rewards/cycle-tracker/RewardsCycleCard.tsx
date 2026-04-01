import { View } from "react-native";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { LinkUnderline, Progress, SbtcIcon } from "@/components/ui";
import { Text } from "@/components/ui/text";
import { InfoTooltipIcon } from "@/components/ui/tooltip-info";
import { RewardsCycleStat } from "./RewardsCycleStat";
import type { RewardsCycle } from "./types";

type RewardsCycleCardProps = {
  cycle: RewardsCycle;
  href: string;
};

function getRewardsCycleStatusText(cycle: RewardsCycle) {
  if (!cycle.isContractActive) {
    return `Starting in ~${Number.isFinite(cycle.startsInDays) ? cycle.startsInDays : 0} days`;
  }

  if (!cycle.isDistributingRewards) {
    return `Rewards start in ${cycle.startsInDays} days`;
  }

  if (cycle.isFinalized) {
    return "Rewards distribution finalized";
  }

  return "Distributing rewards...";
}

function formatRewardsCycleUsdValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function RewardsCycleCard({ cycle, href }: RewardsCycleCardProps) {
  const statusText = getRewardsCycleStatusText(cycle);
  const cycleLabel = cycle.isContractActive ? cycle.cycleNumber : "Not Started";

  const handleOpenLink = () => {
    void openBrowserAsync(href, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  };

  return (
    <View className="border-border-secondary rounded-xl border bg-sand-100 pt-3 pb-6">
      <View className="flex-row items-end justify-between px-3 pt-2">
        <Text className="font-instrument-sans-medium text-secondary text-base leading-6">
          Current rewards cycle
        </Text>
        <InfoTooltipIcon
          content="Information about the upcoming rewards distribution"
          size="sm"
          ariaLabel="More information about the current rewards cycle"
        />
      </View>

      <View className="px-3 pt-2">
        <View className="py-2">
          <Text className="font-matter text-primary text-2xl">
            {cycleLabel}
          </Text>
        </View>

        <View className="py-2">
          <Text className="font-instrument-sans-medium text-secondary text-sm">
            Progress
          </Text>

          <View className="my-1 flex-row items-center gap-2">
            <View className="max-w-[168px] flex-1">
              <Progress
                showThumb={false}
                className="h-1"
                value={cycle.progress}
                indicatorColor="#FF8A64"
              />
            </View>
            <Text className="font-instrument-sans-medium text-tertiary text-xs">
              {Number.isFinite(cycle.progress) ? cycle.progress : 0}%
            </Text>
          </View>

          <Text className="font-instrument-sans-medium text-secondary text-xs leading-5">
            {statusText}
          </Text>
        </View>

        {cycle.isContractActive ? (
          <View className="gap-6 py-2">
            <RewardsCycleStat
              label="Participants"
              value={cycle.participants.toLocaleString()}
            />

            <RewardsCycleStat
              label="Total sBTC participating"
              value={`${cycle.totalSbtcParticipating.toLocaleString()} sBTC`}
              subValue={formatRewardsCycleUsdValue(cycle.totalUsdValue)}
              icon={<SbtcIcon width={14} height={14} />}
            />
          </View>
        ) : null}

        <LinkUnderline
          className="mt-3"
          direction="right"
          size="xs"
          accessibilityLabel="Explore sBTC on chain"
          onPress={handleOpenLink}
        >
          Explore sBTC on chain
        </LinkUnderline>
      </View>
    </View>
  );
}
