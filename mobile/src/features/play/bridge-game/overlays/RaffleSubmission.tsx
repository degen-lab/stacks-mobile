import { AnimatedStarSplash, Pressable, Text, View } from "@/components/ui";
import colors from "@/components/ui/colors";
import GradientBorder from "@/components/ui/gradient-border";
import RaffleEntryIndicator from "./RaffleEntryIndicator";
import type { ActionHandler } from "./types";

type RaffleSubmissionProps = {
  canSubmit: boolean;
  sponsoredSubmissionsLeft: number;
  submissionsUsed?: number;
  statusMessage?: string;
  onSubmit?: ActionHandler;
};

export default function RaffleSubmission({
  canSubmit,
  sponsoredSubmissionsLeft,
  statusMessage,
  onSubmit,
}: RaffleSubmissionProps) {
  return (
    <View className="relative mb-4 w-full">
      <AnimatedStarSplash
        variant="right"
        size={1.2}
        style={{
          top: 48,
          right: -8,
          zIndex: 10,
        }}
      />
      <AnimatedStarSplash
        variant="left"
        size={1}
        style={{
          bottom: 36,
          left: -10,
          zIndex: 10,
        }}
      />
      <GradientBorder
        gradient={colors.stacks.borderGradientBloodOrangeCard}
        borderRadius={18}
        innerBackground="transparent"
      >
        <Pressable
          onPress={canSubmit ? onSubmit : undefined}
          disabled={!canSubmit}
          className={`rounded-[16px] bg-sand-100 p-5 dark:bg-neutral-900/90 ${
            canSubmit
              ? "active:bg-white dark:active:bg-neutral-800"
              : "opacity-80"
          }`}
        >
          <View className="mb-3">
            <Text className="text-xl font-semibold text-primary dark:text-white">
              Weekly Raffle - 500 STX
            </Text>
            <Text className="mt-1 text-sm text-secondary dark:text-sand-300">
              {statusMessage ??
                `You have ${sponsoredSubmissionsLeft} free submissions left today.`}
            </Text>
          </View>
          <RaffleEntryIndicator
            submittedEntries={sponsoredSubmissionsLeft}
            totalSlots={3}
            backgroundColor={colors.neutral[100]}
          />
        </Pressable>
      </GradientBorder>
    </View>
  );
}
