import type React from "react";
import { useMemo } from "react";

import { Info } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Text, View } from "@/components/ui";
import colors from "@/components/ui/colors";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

type DailyMission = {
  id: string;
  label: string;
  current: number;
  target: number;
  pointsReward?: number;
  icon: React.ReactNode;
};

type PointsPopoverProps = {
  visible: boolean;
  onClose: () => void;
  onPressPlay: () => void;
  points?: number | null;
  missions?: DailyMission[];
};

export function PointsPopover({
  visible,
  onClose,
  onPressPlay,
  points = 0,
  missions = [],
}: PointsPopoverProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isPointsLoading = points === null || points === undefined;
  const infoIconColor = isDark ? colors.charcoal[400] : "#595754";

  const displayPoints = useMemo(() => {
    if (points === null || points === undefined) return "0";
    return points.toLocaleString();
  }, [points]);

  return (
    <Popover visible={visible} onClose={onClose}>
      <View className="px-3 pb-4 pt-2">
        {isPointsLoading ? (
          <View className="gap-6">
            <View className="items-center gap-2">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-3 w-20 rounded" />
            </View>

            <View className="flex-row items-center justify-between gap-3 px-1">
              {[1, 2, 3].map((key) => (
                <View key={key} className="flex-1 items-center gap-2 px-1">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </View>
              ))}
            </View>

            <View className="gap-3">
              <Skeleton className="h-12 w-full rounded-full" />
              <View className="flex-row gap-3">
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <Skeleton className="h-12 flex-1 rounded-xl" />
              </View>
            </View>

            <Skeleton className="h-24 w-full rounded-2xl" />
          </View>
        ) : (
          <>
            <View className="items-center mb-6">
              <Text className="font-matter text-6xl text-primary leading-tight">
                {displayPoints}
              </Text>
              <Text className="text-base font-instrument-sans uppercase tracking-widest text-secondary mt-2">
                Points
              </Text>
            </View>

            <View className="mb-6 flex-row gap-3 rounded-xl border border-sand-300 bg-sand-200/80 px-3 py-3 dark:border-surface-secondary dark:bg-surface-secondary/60">
              <View className="h-8 w-8 rounded-full border border-sand-300 bg-white items-center justify-center dark:border-surface-secondary dark:bg-surface-primary">
                <Info size={16} color={infoIconColor} />
              </View>
              <Text className="flex-1 text-sm text-secondary font-instrument-sans leading-5">
                Spend points on power-ups like Drop Point and extra lives, or
                unlock skins to show off your Stacks hero.
              </Text>
            </View>

            <View className="mb-6 rounded-xl border border-sand-200 bg-white p-4 dark:border-surface-secondary dark:bg-surface-primary">
              <Text className="text-lg font-semibold text-primary mb-3 font-matter">
                What are points?
              </Text>
              <View className="gap-3">
                <View className="flex-row gap-1.5 items-start">
                  <Text className="text-sm text-secondary font-matter font-semibold leading-6">
                    1.
                  </Text>
                  <Text className="text-sm text-secondary font-instrument-sans flex-1 leading-6">
                    They&apos;re in-game currency
                  </Text>
                </View>
                <View className="flex-row gap-1.5 items-start">
                  <Text className="text-sm text-secondary font-matter font-semibold leading-6">
                    2.
                  </Text>
                  <Text className="text-sm text-secondary font-instrument-sans flex-1 leading-6">
                    Used to buy power-ups to score higher
                  </Text>
                </View>
                <View className="flex-row gap-1.5 items-start">
                  <Text className="text-sm text-secondary font-matter font-semibold leading-6">
                    3.
                  </Text>
                  <Text className="text-sm text-secondary font-instrument-sans flex-1 leading-6">
                    Top users earn STX rewards
                  </Text>
                </View>
              </View>
            </View>

            <View className="mb-5">
              <Button
                onPress={() => {
                  onClose();
                  onPressPlay();
                }}
                variant="primaryNavbar"
                size="lg"
                label="Play to Earn"
                className="rounded-full"
              />
            </View>
          </>
        )}
      </View>
    </Popover>
  );
}
