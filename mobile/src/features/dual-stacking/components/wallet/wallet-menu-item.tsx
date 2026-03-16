import type { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";

import { Text, View, colors } from "@/components/ui";

type WalletMenuItemProps = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
};

export default function WalletMenuItem({
  label,
  icon: Icon,
  onPress,
  destructive = false,
}: WalletMenuItemProps) {
  const iconColor = destructive ? colors.danger[600] : colors.neutral[700];
  const textClassName = destructive ? "text-red-600" : "text-primary";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-xl border border-surface-secondary bg-neutral-100 px-4 py-4 active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        className={`font-instrument-sans text-sm font-medium ${textClassName}`}
      >
        {label}
      </Text>
      <View pointerEvents="none">
        <Icon size={18} color={iconColor} />
      </View>
    </Pressable>
  );
}
