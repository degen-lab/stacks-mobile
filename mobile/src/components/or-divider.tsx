import { Text, View } from "./ui";

export function OrDivider() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-px flex-1 bg-sand-300 dark:bg-neutral-700" />
      <Text className="text-xs font-instrument-sans text-secondary dark:text-neutral-300">
        OR
      </Text>
      <View className="h-px flex-1 bg-sand-300 dark:bg-neutral-700" />
    </View>
  );
}
