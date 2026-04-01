import { Check, Info } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useMemo } from "react";

import { Text, View } from "@/components/ui";
import colors from "@/components/ui/colors";
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
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

  const infoIconColor = isDark ? colors.charcoal[400] : "#595754";

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
              <Text className="font-matter text-6xl text-primary leading-tight">
                {displayStreak}
              </Text>
              <Text className="text-base font-instrument-sans uppercase tracking-widest text-secondary mt-2">
                Day Streak
              </Text>
            </View>

            <View className="mb-5 rounded-xl border border-sand-200 bg-white p-5 dark:border-surface-secondary dark:bg-surface-primary">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <StreakIcon size={16} />
                  <Text className="text-base font-semibold text-primary font-matter">
                    Streak boost
                  </Text>
                </View>
                <View className="rounded-full border border-sand-300 bg-sand-200 px-3 py-1 dark:border-surface-secondary dark:bg-surface-secondary">
                  <Text className="text-xs font-instrument-sans-medium text-primary">
                    +{boostPercentage}% bonus
                  </Text>
                </View>
              </View>

              <Text className="text-sm text-secondary font-instrument-sans mb-3">
                Complete your daily challenge to increase your bonus points (max
                50%).
              </Text>

              <View className="h-2 w-full rounded-full bg-sand-200 overflow-hidden dark:bg-surface-secondary">
                <View
                  className="h-full rounded-full bg-[#FC6432]"
                  style={{ width: `${boostFillWidth}%` }}
                />
              </View>
            </View>

            <View className="rounded-xl border border-sand-200 bg-white p-5 dark:border-surface-secondary dark:bg-surface-primary">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-primary font-matter">
                  Last 7 days
                </Text>
                <Text className="text-xs font-instrument-sans text-secondary">
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
                          : "bg-surface-tertiary border-sand-200 dark:border-surface-secondary"
                      }`}
                    >
                      {day.completed ? (
                        <Check size={14} color="#fff" strokeWidth={3} />
                      ) : (
                        <View />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-5 flex-row gap-3 rounded-xl border border-sand-300 bg-sand-200/80 px-3 py-3 dark:border-surface-secondary dark:bg-surface-secondary/60">
              <View className="h-8 w-8 rounded-full border border-sand-300 bg-white items-center justify-center dark:border-surface-secondary dark:bg-surface-primary">
                <Info size={16} color={infoIconColor} />
              </View>
              <Text className="flex-1 text-sm text-secondary font-instrument-sans leading-5">
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
