import { Button, Pressable, Text, View } from "@/components/ui";
import { GradientBorderMultiple } from "@/components/ui/gradient-border-multiple";
import { BtcRouteLogo } from "@/components/ui/icons/btc-route-logo";
import { StacksRouteLogo } from "@/components/ui/icons/stacks-route-logo";
import { truncateAddress } from "@/lib/stacks/addresses";
import { GestureResponderEvent } from "react-native";

import { getAccountIcon } from "./account-icon";

// TODO: Future enhancement - Allow users to select custom icons for their accounts

type AccountCardProps = {
  accountIndex: number;
  stxAddress: string;
  btcAddress?: string | null;
  balance?: string;
  isActive?: boolean;
  onPress: () => void;
  onSetActive?: () => void;
};

export const AccountCard = ({
  accountIndex,
  stxAddress,
  btcAddress,
  balance,
  isActive = false,
  onPress,
  onSetActive,
}: AccountCardProps) => {
  const truncatedStxAddress = stxAddress
    ? truncateAddress(stxAddress, 8, 8)
    : "Loading...";
  const truncatedBtcAddress = btcAddress
    ? truncateAddress(btcAddress, 8, 8)
    : "Loading...";

  const IconComponent = getAccountIcon(accountIndex);

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
            </View>
            <View className="mt-1 gap-1">
              <View className="flex-row items-center gap-2">
                <StacksRouteLogo size={14} />
                <Text className="flex-1 text-xs font-instrument-sans text-secondary">
                  {truncatedStxAddress}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <BtcRouteLogo size={14} />
                <Text className="flex-1 text-xs font-instrument-sans text-secondary">
                  {truncatedBtcAddress}
                </Text>
              </View>
            </View>
            {balance && (
              <Text className="mt-1 text-xs font-instrument-sans-medium text-secondary">
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
