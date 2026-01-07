import { Text, View } from "./ui";
import { WarningDiamond } from "./ui/icons/warning-diamond";

export function WarningLabel({ label }: { label: string }) {
  return (
    <View className="flex-row items-center gap-2 bg-feedback-yellow-100 rounded-lg px-4 py-3">
      <WarningDiamond size={14} />
      <Text className="text-sm font-instrument-sans text-primary">{label}</Text>
    </View>
  );
}
