import { Text, View } from "@/components/ui";
import { Toggle } from "@/components/ui/toggle";

import { ActivityItemCard } from "../../components/activity-card";
import { BridgeLayout } from "../../components/bridge-layout";
import { ActivityListSkeleton } from "../../components/activity-card.skeleton";
import type { BridgeHistoryItem } from "@/api/sbtc-bridge/types";
import type { SbtcBridgeConfig } from "@/api/sbtc-bridge/config";

type FilterTab = "all" | "deposit" | "withdrawal";

const FILTER_OPTIONS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposit" },
  { value: "withdrawal", label: "Withdraw" },
];

type BridgeActivityLayoutProps = {
  tab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  items: BridgeHistoryItem[];
  config: SbtcBridgeConfig;
  isLoading: boolean;
};

export function BridgeActivityLayout({
  tab,
  onTabChange,
  items,
  config,
  isLoading,
}: BridgeActivityLayoutProps) {
  return (
    <BridgeLayout>
      <View className="flex-row justify-between items-center">
        <Text className="text-xl">Bridge Activity</Text>
        <Toggle value={tab} onChange={onTabChange} options={FILTER_OPTIONS} />
      </View>

      {!config.isEnabled ? (
        <Text className="font-instrument-sans text-sm text-secondary">
          The bridge is not configured for this network.
        </Text>
      ) : isLoading ? (
        <ActivityListSkeleton />
      ) : items.length === 0 ? (
        <Text className="font-instrument-sans italic text-sm text-sand-500">
          No activity yet.
        </Text>
      ) : (
        <View className="gap-3">
          {items.map((item) => (
            <ActivityItemCard
              key={
                item.type === "deposit"
                  ? `deposit-${item.data.bitcoinTxid}`
                  : `withdrawal-${item.data.txid}`
              }
              item={item}
              config={config}
            />
          ))}
        </View>
      )}
    </BridgeLayout>
  );
}
