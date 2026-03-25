import { ArrowRight, ChevronRight } from "lucide-react-native";

import { Pressable, Skeleton, Text, View, colors } from "@/components/ui";
import { StatusCircleIcon } from "@/components/ui/status-circle-icon";

import type { EarnNextStepCard } from "../../types";

type EarnNextStepsSectionProps = {
  cards: EarnNextStepCard[];
  isLoading: boolean;
  onPressCard: (card: EarnNextStepCard) => void;
};

export function EarnNextStepsSection({
  cards,
  isLoading,
  onPressCard,
}: EarnNextStepsSectionProps) {
  return (
    <View testID="earn-next-steps-section" className="gap-3">
      <Text className="font-matter text-xl leading-6 tracking-tight text-primary">
        What&apos;s next?
      </Text>

      {isLoading ? (
        <NextStepsSkeleton />
      ) : (
        <View className="overflow-hidden rounded-[18px] bg-surface-primary px-2 py-1">
          {cards.map((card, index) => (
            <View key={card.id}>
              {index > 0 ? (
                <View className="mx-3 h-px bg-border-secondary" />
              ) : null}
              <NextStepCard card={card} onPress={() => onPressCard(card)} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function NextStepCard({
  card,
  onPress,
}: {
  card: EarnNextStepCard;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={`earn-next-step-card-${card.id}`}
      accessibilityRole="button"
      accessibilityLabel={card.title}
      className="flex-row items-center justify-between rounded-[14px] px-3 py-3 active:opacity-80"
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-3">
        <NextStepStatusIcon status={card.status} />
        <View className="min-w-0 flex-1">
          <Text
            className="font-matter text-base text-primary"
            numberOfLines={1}
          >
            {card.title}
          </Text>
          <Text
            className="mt-0.5 font-instrument-sans text-xs leading-4 text-secondary"
            numberOfLines={1}
          >
            {card.description}
          </Text>
        </View>
      </View>

      <ChevronRight size={18} color={colors.neutral[300]} />
    </Pressable>
  );
}

function NextStepStatusIcon({
  status,
}: {
  status: EarnNextStepCard["status"];
}) {
  if (status === "success") return <StatusCircleIcon size={32} iconSize={16} />;

  const isPrimary = status === "primary";
  return (
    <View
      className="h-8 w-8 shrink-0 items-center justify-center rounded-full"
      style={{
        backgroundColor: isPrimary ? colors.neutral[900] : colors.neutral[200],
      }}
    >
      <ArrowRight
        size={16}
        color={isPrimary ? colors.white : colors.neutral[500]}
        strokeWidth={2}
      />
    </View>
  );
}

function NextStepsSkeleton() {
  return (
    <View className="overflow-hidden rounded-[18px] bg-surface-primary px-2 py-1">
      {[0, 1].map((index) => (
        <View key={index}>
          {index > 0 ? (
            <View className="mx-3 h-px bg-border-secondary" />
          ) : null}
          <View className="flex-row items-center justify-between rounded-[14px] px-3 py-3">
            <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-3">
              <View className="w-8 shrink-0 items-center justify-center">
                <Skeleton className="h-5 w-5 rounded-full" />
              </View>
              <View className="flex-1 gap-1.5">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </View>
            </View>
            <Skeleton className="h-4 w-4 rounded" />
          </View>
        </View>
      ))}
    </View>
  );
}
