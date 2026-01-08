import { View } from "react-native";

type ProgressProps = {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  completeClassName?: string;
  incompleteClassName?: string;
};

export function Progress({
  value,
  className = "",
  barClassName = "",
  completeClassName = "bg-green-500",
  incompleteClassName = "bg-blue-500",
}: ProgressProps) {
  const progress = Math.min(Math.max(value, 0), 100);
  const isComplete = progress >= 100;

  return (
    <View
      className={`h-2 bg-sand-200 dark:bg-neutral-700 rounded-full overflow-hidden ${barClassName}`}
    >
      <View
        className={`h-full rounded-full ${isComplete ? completeClassName : incompleteClassName} ${className}`}
        style={{ width: `${progress}%` }}
      />
    </View>
  );
}
