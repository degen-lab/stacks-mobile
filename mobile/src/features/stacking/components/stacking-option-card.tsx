import { Pressable, View, Image } from "react-native";
import { Text } from "@/components/ui";
import type { StackingPosition } from "../types";
import { formatUsd } from "@/lib/format/currency";

type Props = {
  title: string;
  description: string;
  apy: number;
  selected?: boolean;
  onPress?: () => void;
  registrationStatus?: "open" | "closed";
  registrationClosesIn?: string;
  lockingTime?: string;
  minimumStx?: number;
  activePosition?: StackingPosition;
  price?: number;
  timeTillRewardPhase?: string;
  cycleEndsInLabel?: string;
};

export function StackingOptionCard({
  title,
  description,
  apy,
  onPress,
  registrationStatus = "open",
  registrationClosesIn,
  lockingTime = "2-week cycles",
  minimumStx = 40,
  activePosition,
  price = 0,
  timeTillRewardPhase,
  cycleEndsInLabel,
}: Props) {
  const isActive = !!activePosition;
  const displayApy = Number((apy * 100).toFixed(1));
  const isUnlocking = activePosition?.status === "UNLOCKING";

  const usdValue = activePosition
    ? (activePosition.lockedAmount * price).toFixed(2)
    : "0.00";

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl border bg-sand-100 p-4 dark:bg-surface-primary ${isActive ? "border-border-secondary" : "border-surface-secondary"}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <Image
            source={require("@/assets/images/fast-pool-logo.png")}
            className="h-12 w-12"
          />
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1">
              <Text className="font-matter text-lg text-primary">{title}</Text>
              {isActive && (
                <View
                  className={`rounded-full px-2 py-1 ${
                    isUnlocking
                      ? "bg-feedback-yellow-100 dark:bg-[#3A3214]"
                      : "bg-green-500/10"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-instrument-sans-semibold uppercase tracking-wide ${
                      isUnlocking
                        ? "text-[#A99100] dark:text-[#FCE7A0]"
                        : "text-green-600"
                    }`}
                  >
                    {isUnlocking ? "Locked" : "Active"}
                  </Text>
                </View>
              )}
              {!isActive && (
                <View className="flex-row items-center gap-1">
                  <View
                    className={`h-2 w-2 rounded-full ${registrationStatus === "open" ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <Text
                    className={`text-xs font-instrument-sans-medium ${registrationStatus === "open" ? "text-green-600" : "text-red-600"}`}
                  >
                    {registrationStatus === "open" ? "Open" : "Closed"}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-sm font-instrument-sans text-secondary leading-4">
              {description}
            </Text>
          </View>
        </View>

        <View className="rounded-full bg-secondary/10 px-2.5 py-1">
          <Text className="text-xs font-instrument-sans-medium text-secondary">
            ~{displayApy}% APY
          </Text>
        </View>
      </View>

      {isActive && activePosition ? (
        <View className="gap-3 pt-4 mt-4 border-t border-surface-secondary/40">
          {isUnlocking ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-instrument-sans text-secondary">
                Cycle ends in
              </Text>
              <Text className="text-sm font-matter text-primary">
                {cycleEndsInLabel ?? "—"}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-instrument-sans text-secondary">
                Rewards phase starts in
              </Text>
              <Text className="text-sm font-matter text-primary">
                {timeTillRewardPhase || "~X days"}
              </Text>
            </View>
          )}
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Stacked amount
            </Text>
            <Text className="text-sm font-instrument-sans text-primary">
              {activePosition.lockedAmount.toLocaleString()} STX • ${usdValue}
            </Text>
          </View>
        </View>
      ) : (
        <View className="gap-2.5 pt-4 mt-4 border-t border-surface-secondary/40">
          {/* Pool Details */}
          {registrationClosesIn && registrationStatus === "open" && (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-instrument-sans text-secondary">
                Registration closes
              </Text>
              <Text className="text-sm font-instrument-sans-medium text-primary">
                {registrationClosesIn}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Lock period
            </Text>
            <Text className="text-sm font-instrument-sans-medium text-primary">
              {lockingTime}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Minimum
            </Text>
            <View className="items-end">
              <Text className="text-sm font-instrument-sans-medium text-primary">
                {minimumStx} STX • {formatUsd(minimumStx * price)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}
