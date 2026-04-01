import { useColorScheme } from "nativewind";
import { View, Card, colors, AnimatedStarSplash } from "@/components/ui";
import GradientBorder from "../../../components/ui/gradient-border";

type InviteFriendCardProps = {
  onPress?: () => void;
};

export default function InviteFriendCard({ onPress }: InviteFriendCardProps) {
  const { colorScheme } = useColorScheme();
  const giftImage =
    colorScheme === "dark"
      ? require("@/assets/images/gift-dark.svg")
      : require("@/assets/images/gift.svg");

  return (
    <View className="relative mt-10">
      <AnimatedStarSplash
        variant="left"
        size={1}
        style={{
          top: -8,
          left: -8,
          zIndex: 10,
        }}
      />

      <AnimatedStarSplash
        variant="right"
        size={1}
        style={{
          bottom: -8,
          right: -6,
          zIndex: 10,
        }}
      />

      <GradientBorder gradient={colors.stacks.borderGradientBloodOrangeCard}>
        <Card
          imageSource={giftImage}
          imageSize={{ width: 72, height: 69.71 }}
          title="Invite a friend!"
          description="Earn 100 points and boosted points for each active referral"
          className="border-0 bg-transparent flex-row items-center gap-4 pr-32 p-6"
          imageClassName="-mt-3"
          onPress={onPress}
        />
      </GradientBorder>
    </View>
  );
}
