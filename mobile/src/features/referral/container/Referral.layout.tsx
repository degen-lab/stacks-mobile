import type { ImageSource } from "expo-image";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, View } from "@/components/ui";
import UserCard from "@/features/referral/components/user-card";
import ReferralCodeCard from "@/features/referral/components/card-gradient-layers";
import ReferralShareSection from "../components/referral-cta";
import StatCard from "../components/card-gradient-right";

export type InvitedPlayer = {
  id: number | string;
  nickname: string;
  joinedAt?: string;
  isActive: boolean;
  pointsEarned: number;
  imageUri?: ImageSource;
};

export type ReferralStats = {
  totalInvites: number;
  activeInvites: number;
  pointsEarned: number;
};

type ReferralLayoutProps = {
  referralCode: string;
  hasReferralCode: boolean;

  stats: ReferralStats;
  invitedPlayers: InvitedPlayer[];

  onShare: () => void;
  onShareChannel: (channel: "x" | "telegram" | "whatsapp") => void;
};

export default function ReferralLayout({
  referralCode,
  hasReferralCode,
  stats,
  invitedPlayers,
  onShare,
  onShareChannel,
}: ReferralLayoutProps) {
  return (
    <SafeAreaView className="flex-1 bg-surface-tertiary">
      <ScrollView className="flex-1 px-4">
        {hasReferralCode && (
          <>
            <View className="flex-row gap-3 mb-6">
              <StatCard
                value={stats.totalInvites}
                label="Total Invites"
                gradient="blood-orange"
              />
              <StatCard
                value={stats.pointsEarned}
                label="Points Earned"
                gradient="bitcoin"
              />
            </View>
          </>
        )}

        <View className="mb-6">
          <ReferralCodeCard
            referralCode={referralCode}
            hasReferralCode={hasReferralCode}
            borderRadius={18}
            innerBackground="#F8F4EF"
          />

          {!hasReferralCode && (
            <Text className="mt-3 text-sm font-instrument-sans text-secondary">
              Sign in again to load your referral code
            </Text>
          )}
        </View>

        <ReferralShareSection
          disabled={!hasReferralCode}
          onShare={onShare}
          onShareChannel={onShareChannel}
        />

        {hasReferralCode && invitedPlayers.length > 0 && (
          <View className="mt-8">
            <Text className="text-xs font-instrument-sans-medium uppercase text-secondary mb-3">
              Friends invited ({stats.activeInvites} Active)
            </Text>

            <View className="gap-2">
              {invitedPlayers.map((player) => (
                <UserCard
                  key={player.id}
                  id={player.id}
                  nickname={player.nickname}
                  joinedAt={player.joinedAt}
                  isActive={player.isActive}
                  pointsEarned={player.pointsEarned}
                  imageUri={player.imageUri}
                />
              ))}
            </View>
          </View>
        )}

        {hasReferralCode && invitedPlayers.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-lg font-matter text-primary mb-2">
              No invites yet
            </Text>
            <Text className="text-sm font-instrument-sans text-secondary text-center px-8">
              Share your code to start earning bonus points
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
