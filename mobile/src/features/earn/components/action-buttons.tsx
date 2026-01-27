import { Text, View, Button } from "@/components/ui";
import { ArrowDownLeft, ArrowUpLeft, Plus } from "lucide-react-native";
import { SwapActionIcon, BridgeActionIcon } from "@/components/ui/icons";
import { EarnActions } from "../hooks/use-earn-actions";

const ACTIONS = [
  {
    label: "Buy",
    icon: <ArrowDownLeft size={16} color="#0B0A0F" />,
    handler: (actions: EarnActions) => actions.handleBuy,
  },
  {
    label: "Sell",
    icon: <ArrowUpLeft size={16} color="#0B0A0F" />,
    handler: (actions: EarnActions) => actions.handleSell,
  },
  {
    label: "Receive",
    icon: <Plus size={16} color="#0B0A0F" />,
    handler: (actions: EarnActions) => actions.handleReceive,
  },
  {
    label: "Swap",
    icon: <SwapActionIcon size={16} color="#0B0A0F" />,
    handler: (actions: EarnActions) => actions.handleSwap,
  },
  {
    label: "Bridge",
    icon: <BridgeActionIcon size={16} color="#0B0A0F" />,
    handler: (actions: EarnActions) => actions.handleBridge,
  },
] as const;

type ActionButtonsProps = {
  actions: EarnActions;
};

export function ActionButtons({ actions }: ActionButtonsProps) {
  return (
    <View className="flex-row flex-wrap gap-4 justify-between">
      {ACTIONS.map((action) => (
        <View key={action.label} className="items-center gap-2">
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
          <Text className="text-sm font-instrument-sans text-primary">
            {action.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
