import {
  Pressable,
  ScreenHeader,
  ScrollView,
  Text,
  View,
} from "@/components/ui";
import { Pencil } from "lucide-react-native";
import { useMemo } from "react";

import { Avatar } from "@/features/header/components/Avatar";
import { useAuth } from "@/lib/store/auth";

export default function ProfileScreen() {
  const { userData } = useAuth();
  const avatarSource = useMemo(
    () => (userData?.user.photo ? { uri: userData.user.photo } : undefined),
    [userData?.user.photo],
  );
  const displayName = userData?.user.name ?? "Stacks user";

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Profile" />
      <ScrollView className="flex-1">
        <View className="relative -mx-4 bg-sand-100 px-4 pb-8 pt-6">
          <View className="items-center">
            <Pressable
              className="relative"
              accessibilityRole="button"
              accessibilityLabel="Edit profile photo"
            >
              <View className="rounded-full border-2 border-border-secondary bg-white shadow-sm">
                <Avatar source={avatarSource} size="xl" />
              </View>

              <View className="absolute bottom-0 right-0 rounded-full border border-border-secondary bg-sand-100 p-1.5">
                <Pencil size={12} className="text-secondary" />
              </View>
            </Pressable>

            <Pressable
              className="mt-5 flex-row items-center gap-2"
              accessibilityRole="button"
              accessibilityLabel="Edit nickname"
            >
              <Text className="text-2xl font-matter text-primary">
                {displayName}
              </Text>
            </Pressable>
          </View>
        </View>
        <View className="px-4">
          <View className="rounded-xl border border-surface-secondary bg-white px-4 py-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-instrument-sans-medium uppercase tracking-wide text-secondary">
                BNS Identity
              </Text>
              <View className="rounded-full bg-sand-200 px-2 py-0.5">
                <Text className="text-xs font-instrument-sans-medium text-secondary">
                  Coming soon
                </Text>
              </View>
            </View>

            <Text className="text-base text-secondary">
              Get your decentralized Bitcoin identity.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
