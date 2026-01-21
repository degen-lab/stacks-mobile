import { Button, Pressable, Text, View } from "@/components/ui";
import { GradientBorderMultiple } from "@/components/ui/gradient-border-multiple";
import {
  Check,
  Wallet,
  Briefcase,
  Coins,
  CreditCard,
  Gem,
  Sparkles,
} from "lucide-react-native";
import { GestureResponderEvent } from "react-native";

// TODO: Future enhancement - Allow users to select custom icons for their accounts
const ACCOUNT_ICONS = [Wallet, Briefcase, Coins, CreditCard, Gem, Sparkles];

type AccountCardProps = {
  accountIndex: number;
  address: string;
  balance?: string;
  isActive?: boolean;
  onPress: () => void;
  onSetActive?: () => void;
};

export const AccountCard = ({
  accountIndex,
  address,
  balance,
  isActive = false,
  onPress,
  onSetActive,
}: AccountCardProps) => {
  const truncatedAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-8)}`
    : "Loading...";

  const IconComponent = ACCOUNT_ICONS[accountIndex % ACCOUNT_ICONS.length];

  const activeLayers = [
    {
      thickness: 3,
      angle: 90,
      colors: ["rgba(255,153,92,0.3)", "rgba(255,153,92,0.1)"] as const,
    },
    {
      thickness: 3,
      angle: 90,
      colors: ["rgba(255,186,140,0.5)", "rgba(255,220,195,0.15)"] as const,
    },
  ] as const;

  const inactiveLayers = [
    {
      thickness: 2,
      angle: 90,
      colors: ["rgba(0,0,0,0.08)", "rgba(0,0,0,0.02)"] as const,
    },
    {
      thickness: 3,
      angle: 90,
      colors: ["rgba(0,0,0,0.06)", "rgba(0,0,0,0.01)"] as const,
    },
  ] as const;

  const content = (
    <Pressable
      onPress={onPress}
      className="w-full rounded-lg p-4 bg-sand-100 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`View Account ${accountIndex + 1}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View
            className={`mr-3 h-10 w-10 items-center justify-center rounded-lg ${
              isActive ? "bg-stacks-blood-orange" : "bg-sand-200"
            }`}
          >
            <IconComponent
              size={20}
              className={isActive ? "text-white" : "text-primary"}
            />
          </View>
          <View className="flex-1">
            <View className="mb-0.5 flex-row items-center gap-2">
              <Text className="font-matter text-base text-primary">
                Account {accountIndex + 1}
              </Text>
              {isActive && <Check size={14} className="text-orange-600" />}
            </View>
            <Text className="text-xs font-instrument-sans text-secondary">
              {truncatedAddress}
            </Text>
            {balance && (
              <Text className="mt-0.5 text-xs font-instrument-sans-medium text-secondary">
                {balance} STX
              </Text>
            )}
          </View>
        </View>
        {!isActive && onSetActive && (
          <Button
            variant="outline"
            size="sm"
            label="Set active"
            onPress={(e: GestureResponderEvent) => {
              e.stopPropagation();
              onSetActive();
            }}
            accessibilityLabel={`Use Account ${accountIndex + 1}`}
            textClassName="text-xs font-instrument-sans-medium"
          />
        )}
      </View>
    </Pressable>
  );

  return (
    <GradientBorderMultiple
      layers={isActive ? activeLayers : inactiveLayers}
      borderRadius={8}
      containerStyle={{ padding: 0 }}
      innerBackground="transparent"
    >
      {content}
    </GradientBorderMultiple>
  );
};
