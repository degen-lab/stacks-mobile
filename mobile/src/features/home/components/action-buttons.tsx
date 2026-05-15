import { Text, View, Button, colors } from "@/components/ui";
import { ArrowDownLeft, ArrowLeftRight } from "lucide-react-native";
import { SwapActionIcon, BridgeActionIcon } from "@/components/ui/icons";
import { useColorScheme } from "nativewind";
import type { EarnQuickActions } from "../../earn/types";

const ACTIONS = [
  {
    label: "Buy",
    renderIcon: (color: string) => <ArrowDownLeft size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onBuy,
  },
  {
    label: "Transfer",
    renderIcon: (color: string) => <ArrowLeftRight size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onTransfer,
  },
  {
    label: "Swap",
    renderIcon: (color: string) => <SwapActionIcon size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onSwap,
  },
  {
    label: "Bridge",
    renderIcon: (color: string) => <BridgeActionIcon size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onBridge,
  },
] as const;

type ActionButtonsProps = {
  actions: EarnQuickActions;
};

export function EarnActionButtons({ actions }: ActionButtonsProps) {
  const { colorScheme } = useColorScheme();
  const iconColor =
    colorScheme === "dark" ? colors.charcoal[100] : colors.neutral[950];

  return (
    <View className="flex-row gap-3">
      {ACTIONS.map((action) => (
        <View key={action.label} className="flex-1 items-center gap-1.5">
          <Button
            variant="iconCircle"
            size="iconCircle"
            leftIcon={action.renderIcon(iconColor)}
            label={action.label}
            iconOnly
            accessibilityLabel={action.label}
            testID={`earn-action-${action.label.toLowerCase()}`}
            onPress={action.handler(actions)}
          />
          <Text className="text-xs font-instrument-sans text-primary">
            {action.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
