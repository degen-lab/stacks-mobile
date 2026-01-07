import { colors, Text, View } from "@/components/ui";
import GradientBorder from "@/components/ui/gradient-border";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentType } from "react";
import { Pressable } from "react-native";

type IconComponent = ComponentType<{ size?: number; color?: string }>;

type MenuButtonProps = {
  label: string;
  icon: IconComponent;
  onPress?: () => void;
};

export default function MenuButton({
  label,
  icon: Icon,
  onPress,
}: MenuButtonProps) {
  return (
    <GradientBorder
      borderRadius={12}
      gradient={colors.stacks.menuStroke}
      angle={-90}
      hasShadow={false}
    >
      <Pressable onPress={onPress}>
        <View className="flex-row items-center px-5 py-4">
          <Icon />
          <Text className="ml-2 text-sm font-instrument-sans text-primary">
            {label}
          </Text>

          <LinearGradient
            colors={colors.stacks.menuFillBottom}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 0.7 }}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: "20%", // show gradient only on the right portion
            }}
          />
        </View>
      </Pressable>
    </GradientBorder>
  );
}
