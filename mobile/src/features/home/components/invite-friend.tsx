import { Card, colors, AnimatedStarSplash } from "@/components/ui";
import { View } from "react-native";
import GradientBorder from "../../../components/ui/gradient-border";

type InviteFriendCardProps = {
  onPress?: () => void;
};

export default function InviteFriendCard({ onPress }: InviteFriendCardProps) {
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
          imageSource={require("@/assets/images/gift.svg")}
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
