import { Image, StyleSheet } from "react-native";

import { Button, SafeAreaView, ScrollView, Text, View } from "@/components/ui";
import BoostYieldIcon from "@/components/ui/icons/boost-yield-icon";
import { LockIcon } from "@/components/ui/icons/lock-icon";
import { SparkleIcon } from "@/components/ui/icons/sparkle";

type Props = {
  onEnable: () => void;
  onSkip: () => void;
  loading?: boolean;
};

type BenefitRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function BenefitRow({ icon, title, description }: BenefitRowProps) {
  return (
    <View className="flex-row items-center gap-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-primary">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-instrument-sans-medium text-base text-primary">
          {title}
        </Text>
        <Text className="mt-0.5 font-instrument-sans text-sm leading-5 text-secondary">
          {description}
        </Text>
      </View>
    </View>
  );
}

export function PrivacyConsentOnboarding({
  onEnable,
  onSkip,
  loading = false,
}: Props) {
  return (
    <SafeAreaView className="flex-1 bg-surface-tertiary">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-14 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Image
            source={require("@/assets/game/hero/orange.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <Text className="font-matter text-4xl leading-[44px] tracking-tight text-primary">
          Help us incentivize{"\n"}the ecosystem
        </Text>
        <Text className="mt-4 text-base leading-7 text-secondary">
          Personalized ads earn us more — directly funding sponsored
          transactions for you.
        </Text>

        <View className="mt-8 gap-7">
          <BenefitRow
            icon={<SparkleIcon size={20} />}
            title="Relevant ads only"
            description="Web3 apps you'd enjoy — not spam."
          />
          <BenefitRow
            icon={<BoostYieldIcon width={14} height={20} />}
            title="Keeps the app free"
            description="Ad revenue covers our running costs."
          />
          <BenefitRow
            icon={<LockIcon size={20} color="#595754" />}
            title="Your identity stays private"
            description="No names, emails, or payment info. Just app behavior."
          />
        </View>

        <View className="mt-12 gap-3">
          <Button
            variant="primaryNavbar"
            size="lg"
            label="Allow personalized ads"
            onPress={onEnable}
            loading={loading}
            className="rounded-full"
          />
          <Button
            variant="ghost"
            size="lg"
            label="Continue without"
            onPress={onSkip}
            disabled={loading}
            textClassName="font-instrument-sans-medium text-secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    width: 96,
    height: 96,
  },
});
