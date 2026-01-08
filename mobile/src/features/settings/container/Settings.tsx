import Constants from "expo-constants";
import { useRouter } from "expo-router";

import { Button, ScreenHeader, ScrollView, Text, View } from "@/components/ui";

import { HelpItem } from "../components/help-item";
import { Item } from "../components/item";
import { NetworkItem } from "../components/network-item";
import { SecurityItem } from "../components/security-item";

export default function SettingsScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const deviceId = Constants.deviceName ?? "Unknown";

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Settings" />
      <ScrollView className="flex-1 px-4 pt-6">
        <View className="overflow-hidden rounded-2xl border border-surface-secondary bg-white">
          <Item
            label="Wallet"
            onPress={() => router.push("/settings/accounts" as any)}
          />
          {/* <Item
            label="Display"
            onPress={() => router.push("/settings/display" as any)}
          /> */}
          <View className="mx-4 border-b border-surface-secondary" />
          <SecurityItem />
          <View className="mx-4 border-b border-surface-secondary" />
          <NetworkItem />
          <View className="mx-4 border-b border-surface-secondary" />
          <HelpItem />
        </View>

        <View className="mt-6 items-center">
          <Text className="text-sm text-secondary">Version {version}</Text>
          <Text className="mt-1 text-sm text-secondary">
            Device ID: {deviceId}
          </Text>
        </View>
        <View className="mt-5">
          <Button
            variant="outline"
            size="lg"
            label="Lock App"
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </View>
  );
}
