import { colors, Text, View } from "@/components/ui";
import { StreakIcon } from "@/components/ui/icons/streak";
import { Check } from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";

type DailyStreakCardProps = {
  challengeDescription: string;
  lastCompletionDate?: Date | string | null;
  currentStreak?: number;
};

const CARD_BG = colors.neutral[100]; // light, consistent surface

const isToday = (value?: Date | string | null) => {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export default function DailyStreakCard({
  challengeDescription,
  lastCompletionDate,
}: DailyStreakCardProps) {
  const completedToday = isToday(lastCompletionDate);

  return (
    <View
      className="rounded-[16px] px-4 py-6 flex-row items-center border border-surface-secondary"
      style={{ backgroundColor: CARD_BG }}
    >
      {completedToday ? (
        <View
          className="mr-4 h-12 w-12 rounded-full items-center justify-center"
          style={{ backgroundColor: "rgba(252,100,50,0.14)" }}
        >
          <Check size={20} color={colors.stacks.bloodOrange} />
        </View>
      ) : (
        <View className="mr-3 items-center justify-center">
          <Svg width={36} height={36} viewBox="0 0 32 32">
            <Circle
              cx={16}
              cy={16}
              r={15}
              stroke={colors.neutral[500]}
              strokeWidth={1}
              fill="none"
              strokeDasharray="2 4"
            />
          </Svg>
        </View>
      )}

      <View className="flex-1 gap-1">
        <View className="flex-row items-end justify-between">
          <Text className="text-base font-instrument-sans-medium text-primary">
            Daily challenge
          </Text>

          {completedToday ? null : (
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-1">
                <StreakIcon />
                <Text className="text-base font-instrument-sans text-secondary">
                  +1
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-instrument-sans text-primary flex-1">
            {completedToday
              ? "See you tomorrow with a new challenge!"
              : challengeDescription}
          </Text>
        </View>
      </View>
    </View>
  );
}
