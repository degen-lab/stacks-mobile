import {
  AnimatedStarSplash,
  ClassicTicket,
  Pressable,
  Text,
  View,
  colors,
} from "@/components/ui";
import GradientBorder from "@/components/ui/gradient-border";
import { useColorScheme } from "nativewind";
import { VISUAL_CONFIG } from "../../config";

type RaffleSubmissionProps = {
  canSubmit: boolean;
  sponsoredSubmissionsLeft: number;
  submissionsUsed?: number;
  statusMessage?: string;
  onSubmit?: () => void | Promise<void>;
};

type RaffleEntryIndicatorProps = {
  submittedEntries: number;
  totalSlots?: number;
  backgroundColor?: string;
};

const RaffleEntryIndicator = ({
  submittedEntries,
  totalSlots = 3,
  backgroundColor = colors.neutral[100],
}: RaffleEntryIndicatorProps) => {
  return (
    <View className="flex-row items-start justify-between px-2 w-full">
      {Array.from({ length: totalSlots }).map((_, index) => {
        const isActive = index < submittedEntries;
        return (
          <ClassicTicket
            key={index}
            active={isActive}
            backgroundColor={backgroundColor}
          />
        );
      })}
    </View>
  );
};

export default function RaffleSubmission({
  canSubmit,
  sponsoredSubmissionsLeft,
  statusMessage,
  onSubmit,
}: RaffleSubmissionProps) {
  const { colorScheme } = useColorScheme();
  const ticketBackgroundColor =
    colorScheme === "dark"
      ? VISUAL_CONFIG.DARK_SCENE.CARD_BG
      : colors.neutral[100];

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
          className={`rounded-2xl bg-sand-100 p-5 dark:bg-surface-primary ${
            canSubmit
              ? "active:bg-sand-200 dark:active:bg-surface-secondary"
              : "opacity-80"
          }`}
        >
          <View className="mb-3">
            <Text className="text-xl font-semibold text-primary">
              Weekly Raffle - 500 STX
            </Text>
            <Text className="mt-1 text-sm text-secondary">
              {statusMessage ??
                `You have ${sponsoredSubmissionsLeft} free submissions left today.`}
            </Text>
          </View>
          <RaffleEntryIndicator
            submittedEntries={sponsoredSubmissionsLeft}
            totalSlots={3}
            backgroundColor={ticketBackgroundColor}
          />
        </Pressable>
      </GradientBorder>
    </View>
  );
}
