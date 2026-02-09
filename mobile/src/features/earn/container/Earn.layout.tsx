import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  Text,
  View,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import { StatsCards } from "@/features/earn/components/stats-cards";
import { ActionButtons } from "@/features/earn/components/action-buttons";
import { DeFiProtocolsList } from "@/features/earn/components/defi-protocols-list";
import { EarnActions } from "@/features/earn/hooks/use-earn-actions";

type EarnProps = {
  totalBalance: string | null;
  totalEarnings: number | null;
  actions: EarnActions;
  activeTab: string;
  onTabChange: (value: string) => void;
};

export default function EarnLayout({
  totalBalance,
  totalEarnings,
  actions,
  activeTab,
  onTabChange,
}: EarnProps) {
  return (
    <SafeAreaView className=" bg-surface-tertiary" edges={["bottom"]}>
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24, gap: 24 }}
      >
        <StatsCards totalBalance={totalBalance} totalEarnings={totalEarnings} />
        <ActionButtons actions={actions} />

        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList>
            <TabsTrigger value="defi">Earn with DeFi</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="defi">
            <DeFiProtocolsList />
          </TabsContent>

          <TabsContent value="assets">
            <View className="py-10">
              <Text className="text-2xl font-matter font-bold text-foreground text-center">
                Assets
              </Text>
              <Text className="mt-2 text-lg text-secondary text-center">
                Coming soon.
              </Text>
            </View>
          </TabsContent>
        </Tabs>
      </ScrollView>
    </SafeAreaView>
  );
}
