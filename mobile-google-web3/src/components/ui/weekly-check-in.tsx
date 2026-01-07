import { Text } from "./text";
import { View } from "react-native";

type WeeklyCheckInProps = {
  weekDays: boolean[];
  size?: number;
  filledClassName?: string;
  emptyClassName?: string;
  label?: string;
  showDayNumbers?: boolean;
};

export function WeeklyCheckIn({
  weekDays,
  size = 18,
  filledClassName = "bg-primary-500",
  emptyClassName = "bg-surface-secondary",
  label,
  showDayNumbers = false,
}: WeeklyCheckInProps) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2 flex-1">
        {weekDays.map((filled, index) => (
          <View
            key={index}
            className={`rounded-full items-center justify-center ${filled ? filledClassName : emptyClassName}`}
            style={{ width: size, height: size }}
          >
            {showDayNumbers ? (
              <Text className="text-[10px] font-instrument-sans-medium text-secondary">
                {index + 1}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
      {label ? (
        <Text className="ml-3 text-xs font-instrument-sans-medium text-secondary">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
