import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Pressable } from "react-native";

import { Button, Text, View, colors } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/features/header/components/Avatar";
import type { LeaderboardUser } from "@/features/leaderboard/types";
import { getLeaderboardDisplayName } from "@/features/leaderboard/utils";
import { ChevronRight } from "lucide-react-native";

export const REPORT_REASONS = [
  "Inappropriate profile photo",
  "Offensive username",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REASON_API_MAP: Record<
  ReportReason,
  "inappropriate_photo" | "offensive_username" | "other"
> = {
  "Inappropriate profile photo": "inappropriate_photo",
  "Offensive username": "offensive_username",
  Other: "other",
};

type Step = "profile" | "reason" | "done";

type ReportUserSheetProps = {
  user: LeaderboardUser | null;
  onReport?: (user: LeaderboardUser, reason: ReportReason) => void;
  onClose?: () => void;
};

export const ReportUserSheet = React.forwardRef<
  BottomSheetModal,
  ReportUserSheetProps
>(({ user, onReport, onClose }, ref) => {
  const [step, setStep] = useState<Step>("profile");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const sheetBackgroundColor = isDark ? undefined : colors.white;

  const handleSelectReason = (reason: ReportReason) => {
    if (user) onReport?.(user, reason);
    setStep("done");
  };

  const handleDismiss = () => {
    setStep("profile");
    onClose?.();
  };

  if (!user) return null;

  const displayName = getLeaderboardDisplayName(user.name);

  return (
    <Modal
      ref={ref}
      enableDynamicSizing
      onDismiss={handleDismiss}
      backgroundStyle={
        sheetBackgroundColor
          ? {
              backgroundColor: sheetBackgroundColor,
            }
          : undefined
      }
      handleBackgroundColor={sheetBackgroundColor}
    >
      <BottomSheetScrollView contentContainerClassName="px-5 pb-8">
        {step === "profile" && (
          <>
            <View className="items-center py-4 mb-2">
              <Avatar source={user.photoUri} size="xl" />
              <Text className="mt-3 text-xl font-matter text-primary dark:text-white">
                {displayName}
              </Text>
              {user.rank > 0 && (
                <Text className="mt-1 text-sm font-instrument-sans text-secondary dark:text-neutral-400">
                  Rank #{user.rankLabel ?? user.rank} ·{" "}
                  {user.scoreLabel ?? user.score.toLocaleString()} pts
                </Text>
              )}
            </View>
            <Button
              label="Report this user"
              variant="ghost"
              size="lg"
              textClassName="text-red-500 dark:text-red-500"
              onPress={() => setStep("reason")}
            />
          </>
        )}

        {step === "reason" && (
          <>
            <View className="flex-row items-center gap-3 mb-6 mt-2">
              <Avatar source={user.photoUri} size="sm" />
              <View className="flex-1">
                <Text className="text-xl font-matter text-primary dark:text-white">
                  Report {displayName}
                </Text>
                <Text className="text-sm font-instrument-sans text-secondary dark:text-neutral-400">
                  Your report is confidential.
                </Text>
              </View>
            </View>
            {REPORT_REASONS.map((reason, index) => (
              <Pressable
                key={reason}
                onPress={() => handleSelectReason(reason)}
                style={({ pressed }) =>
                  pressed ? { opacity: 0.6 } : undefined
                }
              >
                <View
                  className={`flex-row items-center justify-between py-4 ${index < REPORT_REASONS.length - 1 ? "border-b border-border-secondary" : ""}`}
                >
                  <Text
                    className="text-base font-instrument-sans text-primary dark:text-white flex-1 mr-2"
                    numberOfLines={1}
                  >
                    {reason}
                  </Text>
                  <ChevronRight
                    size={18}
                    color={isDark ? colors.neutral[500] : colors.neutral[400]}
                  />
                </View>
              </Pressable>
            ))}
          </>
        )}

        {step === "done" && (
          <View className="items-center py-6">
            <Text className="text-xl font-matter text-primary dark:text-white mb-3 text-center">
              Thanks for letting us know
            </Text>
            <Text className="text-sm font-instrument-sans text-secondary dark:text-neutral-400 text-center leading-5">
              We&apos;ll review this report and take action to keep the
              community safe.
            </Text>
            <View className="h-8" />
            <Button
              label="Done"
              size="lg"
              onPress={handleDismiss}
              variant="secondary"
            />
          </View>
        )}
      </BottomSheetScrollView>
    </Modal>
  );
});

ReportUserSheet.displayName = "ReportUserSheet";
