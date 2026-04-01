import { useColorScheme } from "nativewind";
import { Text, View } from "./ui";
import { WarningDiamond } from "./ui/icons/warning-diamond";

export function WarningLabel({ label }: { label: string }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-row items-center gap-2 rounded-lg bg-feedback-yellow-100 px-4 py-3 dark:bg-[#3A3214]">
      <WarningDiamond size={14} color={isDark ? "#FCD34D" : "#A99100"} />
      <Text className="text-sm font-instrument-sans text-primary dark:text-[#FCE7A0]">
        {label}
      </Text>
    </View>
  );
}
