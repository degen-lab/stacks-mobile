import { Text, View, Button, colors } from "@/components/ui";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  ArrowLeftRight,
} from "lucide-react-native";
import { Platform } from "react-native";
import { SwapActionIcon, BridgeActionIcon } from "@/components/ui/icons";
import { useColorScheme } from "nativewind";
import type { EarnQuickActions } from "../../earn/types";

const ACTIONS = [
  {
    label: "Buy",
    renderIcon: (color: string) => <ArrowDownLeft size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onBuy,
    hiddenOnIOS: true,
  },
  {
    label: "Sell",
    renderIcon: (color: string) => <ArrowUpLeft size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onSell,
    hiddenOnIOS: true,
  },
  {
    label: "Transfer",
    renderIcon: (color: string) => <ArrowLeftRight size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onTransfer,
    hiddenOnIOS: false,
  },
  {
    label: "Swap",
    renderIcon: (color: string) => <SwapActionIcon size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onSwap,
    hiddenOnIOS: false,
  },
  {
    label: "Bridge",
    renderIcon: (color: string) => <BridgeActionIcon size={16} color={color} />,
    handler: (actions: EarnQuickActions) => actions.onBridge,
    hiddenOnIOS: false,
  },
] as const;

type ActionButtonsProps = {
  actions: EarnQuickActions;
};

export function EarnActionButtons({ actions }: ActionButtonsProps) {
  const { colorScheme } = useColorScheme();
  const iconColor =
    colorScheme === "dark" ? colors.charcoal[100] : colors.neutral[950];
  const visibleActions = ACTIONS.filter(
    (action) => !(Platform.OS === "ios" && action.hiddenOnIOS),
  );

  return (
    <View className="flex-row gap-1.5">
      {visibleActions.map((action) => (
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
