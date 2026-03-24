import { Text, View, Button } from "@/components/ui";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  ArrowLeftRight,
} from "lucide-react-native";
import { SwapActionIcon, BridgeActionIcon } from "@/components/ui/icons";
import type { EarnQuickActions } from "../../earn/types";

const ACTIONS = [
  {
    label: "Buy",
    icon: <ArrowDownLeft size={16} color="#0B0A0F" />,
    handler: (actions: EarnQuickActions) => actions.onBuy,
  },
  {
    label: "Sell",
    icon: <ArrowUpLeft size={16} color="#0B0A0F" />,
    handler: (actions: EarnQuickActions) => actions.onSell,
  },
  {
    label: "Transfer",
    icon: <ArrowLeftRight size={16} color="#0B0A0F" />,
    handler: (actions: EarnQuickActions) => actions.onTransfer,
  },
  {
    label: "Swap",
    icon: <SwapActionIcon size={16} color="#0B0A0F" />,
    handler: (actions: EarnQuickActions) => actions.onSwap,
  },
  {
    label: "Bridge",
    icon: <BridgeActionIcon size={16} color="#0B0A0F" />,
    handler: (actions: EarnQuickActions) => actions.onBridge,
  },
] as const;

type ActionButtonsProps = {
  actions: EarnQuickActions;
};

export function EarnActionButtons({ actions }: ActionButtonsProps) {
  return (
    <View className="flex-row gap-1.5">
      {ACTIONS.map((action) => (
        <View key={action.label} className="flex-1 items-center gap-1.5">
          <Button
            variant="iconCircle"
            size="iconCircle"
            leftIcon={action.icon}
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
