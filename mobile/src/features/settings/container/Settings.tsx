import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader, ScrollView, Text, View } from "@/components/ui";

import { ThemeItem } from "../components/theme-item";
import { HelpItem } from "../components/help-item";
import { Item } from "../components/item";
import { NetworkItem } from "../components/network-item";
import { SecurityItem } from "../components/security-item";

export default function SettingsScreen() {
  const router = useRouter();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const deviceId = Constants.deviceName ?? "Unknown";

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Settings" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="grow justify-between px-4 pt-6"
        contentContainerStyle={{
          paddingBottom: Math.max(32, bottomInset + 16),
        }}
      >
        <View className="overflow-hidden rounded-2xl border border-surface-secondary bg-white dark:bg-surface-primary">
          <Item
            label="Wallet"
            onPress={() => router.push("/settings/accounts" as any)}
          />
          <View className="mx-4 border-b border-surface-secondary" />
          <ThemeItem />
          <View className="mx-4 border-b border-surface-secondary" />
          <SecurityItem />
          {__DEV__ && (
            <>
              <View className="mx-4 border-b border-surface-secondary" />
              <NetworkItem />
            </>
          )}
          <View className="mx-4 border-b border-surface-secondary" />
          <Item
            label="Privacy"
            onPress={() => router.push("/settings/privacy-ads" as any)}
          />
          <View className="mx-4 border-b border-surface-secondary" />
          <HelpItem />
          <View className="mx-4 border-b border-surface-secondary" />
          <Item
            label="Delete Account"
            variant="danger"
            onPress={() => router.push("/settings/delete-account" as any)}
          />
        </View>

        <View className="items-center">
          <Text className="text-sm text-secondary">Version {version}</Text>
          <Text className="mt-1 text-sm text-secondary">
            Device ID: {deviceId}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
