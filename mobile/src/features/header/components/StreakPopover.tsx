import { Check, Info } from "lucide-react-native";
import { useMemo } from "react";

import { Text, View } from "@/components/ui";
import { StreakIcon } from "@/components/ui/icons/streak";
import { Popover } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { StreakDay } from "@/lib/format/date";
import { calculateStreakStats } from "@/lib/streak";

type StreakPopoverProps = {
  visible: boolean;
  onClose: () => void;
  streak?: number | null;
  days?: StreakDay[];
  loading?: boolean;
};

const DEFAULT_DAYS: StreakDay[] = [
  { id: "mon", label: "M", completed: true },
  { id: "tue", label: "T", completed: true },
  { id: "wed", label: "W", completed: true },
  { id: "thu", label: "T", completed: false },
  { id: "fri", label: "F", completed: false },
  { id: "sat", label: "S", completed: false },
  { id: "sun", label: "S", completed: false },
];

export function StreakPopover({
  visible,
  onClose,
  streak = 0,
  days = DEFAULT_DAYS,
  loading = false,
}: StreakPopoverProps) {
  const isLoading = loading || streak === null || streak === undefined;
  const currentStreak = streak ?? 0;
  const resolvedDays = days.length ? days : DEFAULT_DAYS;

  const displayStreak = useMemo(() => {
    try {
      return currentStreak.toLocaleString();
    } catch {
      return String(currentStreak);
    }
  }, [currentStreak]);

  const { boostPercentage } = useMemo(
    () =>
      calculateStreakStats({
        streak: Math.max(0, currentStreak),
        maxBoost: 50,
      }),
    [currentStreak],
  );

  const boostFillWidth = useMemo(() => {
    const clamped = Math.min(50, Math.max(0, boostPercentage));
    return (clamped / 50) * 100;
  }, [boostPercentage]);

  return (
    <Popover visible={visible} onClose={onClose}>
      <View className="px-3 pb-4 pt-2">
        {isLoading ? (
          <View className="gap-6">
            <View className="items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-12 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </View>
            <View className="flex-row items-center justify-between gap-3 px-1">
              {[1, 2, 3, 4, 5, 6, 7].map((key) => (
                <View key={key} className="flex-1 items-center gap-2 px-1">
                  <Skeleton className="h-9 w-10 rounded-full" />
                  <Skeleton className="h-3 w-12 rounded" />
                </View>
              ))}
            </View>
            <Skeleton className="h-24 w-full rounded-2xl" />
          </View>
        ) : (
          <>
            <View className="items-center mb-6 pt-1">
              <Text className="font-matter text-6xl text-primary dark:text-white leading-tight">
                {displayStreak}
              </Text>
              <Text className="text-base font-instrument-sans uppercase tracking-widest text-secondary dark:text-sand-300 mt-2">
                Day Streak
              </Text>
            </View>

            <View className="bg-white dark:bg-neutral-800/50 rounded-xl p-5 mb-5 border border-sand-200 dark:border-neutral-700">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <StreakIcon size={16} />
                  <Text className="text-base font-semibold text-primary dark:text-white font-matter">
                    Streak boost
                  </Text>
                </View>
                <View className="rounded-full bg-sand-200 dark:bg-neutral-700 border border-sand-300 dark:border-neutral-600 px-3 py-1">
                  <Text className="text-xs font-instrument-sans-medium text-primary dark:text-white">
                    +{boostPercentage}% bonus
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-secondary dark:text-sand-300 font-instrument-sans mb-3">
                Complete your daily challenge to increase your bonus points (max
                50%).
              </Text>

              <View className="h-2 w-full rounded-full bg-sand-200 dark:bg-neutral-700 overflow-hidden">
                <View
                  className="h-full rounded-full bg-[#FC6432]"
                  style={{ width: `${boostFillWidth}%` }}
                />
              </View>
            </View>

            <View className="bg-white dark:bg-neutral-800/50 rounded-xl p-5 border border-sand-200 dark:border-neutral-700">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-primary dark:text-white font-matter">
                  Last 7 days
                </Text>
                <Text className="text-xs font-instrument-sans text-secondary dark:text-sand-300">
                  {resolvedDays.filter((day) => day.completed).length}/7 active
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-2">
                {resolvedDays.map((day) => (
                  <View key={day.id} className="flex-1 items-center gap-2">
                    <Text className="text-[10px] font-instrument-sans-medium text-secondary">
                      {day.label}
                    </Text>
                    <View
                      className={`h-9 w-9 rounded-full items-center justify-center border ${
                        day.completed
                          ? "bg-[#FC6432] border-[#E17C18] shadow-elevation-light-m"
                          : "bg-surface-tertiary border-sand-200 dark:border-neutral-700"
                      }`}
                    >
                      {day.completed ? (
                        <Check size={14} color="#fff" strokeWidth={3} />
                      ) : (
                        <View className="" />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="flex-row gap-3 mt-5 bg-sand-200/80 dark:bg-neutral-800/50 rounded-xl px-3 py-3 border border-sand-300 dark:border-neutral-700">
              <View className="h-8 w-8 rounded-full items-center justify-center bg-white dark:bg-neutral-700 border border-sand-300 dark:border-neutral-600">
                <Info size={16} color="#595754" />
              </View>
              <Text className="flex-1 text-sm text-secondary dark:text-sand-300 font-instrument-sans leading-5">
                Missing a day lose your progress, play daily to keep the streak
                alive.
              </Text>
            </View>
          </>
        )}
      </View>
    </Popover>
  );
}
