import { Pressable, View, Image } from "react-native";
import { Text, colors } from "@/components/ui";
import { MoreVertical } from "lucide-react-native";
import type { StackingPosition } from "../types";

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
  onMenuPress?: () => void;
  // Active position
  activePosition?: StackingPosition;
  price?: number;
};

export function StackingOptionCard({
  title,
  description,
  apy,
  selected,
  onPress,
  registrationStatus = "open",
  registrationClosesIn,
  lockingTime = "2-week cycles",
  minimumStx = 40,
  onMenuPress,
  activePosition,
  price = 0,
}: Props) {
  const isActive = !!activePosition;

  const usdValue = activePosition
    ? (activePosition.lockedAmount * price).toFixed(2)
    : "0.00";
  // Rewards ETA: should be calculated as (current cycle end - now) + pool payout window (Fast Pool commonly ~1 day).
  // TODO: replace placeholder with real value from stacking info once available.
  const rewardsInCopy = "~X days";
  // Unlock ETA is only relevant when the user has revoked but funds are still locked until the current cycle settles.
  // TODO: derive this from delegation status + next cycle end timestamp (e.g., nextUnlockDays or cycleEnd + ~1 day buffer).
  const isRevoking = activePosition?.status === "UNLOCKING";
  const unlocksCopy = `${activePosition?.nextUnlockDays ?? "~X"} days`;

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl border p-4 bg-sand-100 ${isActive ? "border-border-secondary" : "border-surface-secondary"}`}
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
                <View className="rounded-full bg-green-500/10 px-2 py-1">
                  <Text className="text-[10px] font-instrument-sans-semibold text-green-600 uppercase tracking-wide">
                    Active
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

        {isActive ? (
          <Pressable
            onPress={onMenuPress}
            className="h-8 w-8 items-center justify-center rounded-full border border-sand-300 bg-sand-100"
            hitSlop={8}
          >
            <MoreVertical size={14} color={colors.neutral[900]} />
          </Pressable>
        ) : (
          <View className="rounded-full bg-secondary/10 px-2.5 py-1">
            <Text className="text-xs font-instrument-sans-medium text-secondary">
              {(apy * 100).toFixed(0)}% APY
            </Text>
          </View>
        )}
      </View>

      {/* Details Section */}
      {isActive && activePosition ? (
        <View className="gap-3 pt-4 mt-4 border-t border-surface-secondary/40">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Stacked amount
            </Text>
            <Text className="text-sm font-instrument-sans text-primary">
              (${usdValue}) • {activePosition.lockedAmount.toLocaleString()} STX
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Receive rewards in
            </Text>
            <Text className="text-sm font-matter text-primary">
              {rewardsInCopy}
            </Text>
          </View>
          {/* Show unlock timing only when the user has revoked but the cycle is still active. */}
          {isRevoking && (
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-instrument-sans text-secondary">
                Funds unlock in
              </Text>
              <Text className="text-sm font-matter text-primary">
                {unlocksCopy}
              </Text>
            </View>
          )}
          {/* Copy/logic notes:
              - Rewards: (current cycle end + pool payout window) from stacking info.
              - Unlocks: only render when status === "UNLOCKING"; derive from nextUnlockDays or (cycle end + ~1 day). */}

          {/* Removed duplicated rewards row to avoid redundancy with calculator */}
        </View>
      ) : (
        <View className="gap-2.5 pt-4 mt-4 border-t border-surface-secondary/40">
          {/* Pool Details */}
          {registrationClosesIn && registrationStatus === "open" && (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-instrument-sans text-secondary">
                Registration closes
              </Text>
              <Text className="text-xs font-instrument-sans-medium text-primary">
                {registrationClosesIn}
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-instrument-sans text-secondary">
              Lock period
            </Text>
            <Text className="text-xs font-instrument-sans-medium text-primary">
              {lockingTime}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-instrument-sans text-secondary">
              Minimum
            </Text>
            <Text className="text-xs font-instrument-sans-medium text-primary">
              {minimumStx} STX
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}
