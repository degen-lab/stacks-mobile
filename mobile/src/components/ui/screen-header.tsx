import { Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "./text";
import colors from "./colors";

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel: string;
  };
  rightSlot?: React.ReactNode;
};

export function ScreenHeader({
  title,
  onBack,
  rightAction,
  rightSlot,
}: ScreenHeaderProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        router.back();
      }
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="bg-surface-tertiary">
      <View className="flex-row items-center px-4 py-4 border-b border-surface-secondary">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft
            size={20}
            color={isDark ? colors.neutral[100] : colors.neutral[900]}
            pointerEvents="none"
          />
        </Pressable>

        <Text className="text-xl font-matter text-primary flex-1 text-center">
          {title}
        </Text>

        {rightSlot ? (
          <View className="items-end justify-center">{rightSlot}</View>
        ) : rightAction ? (
          <Pressable
            onPress={rightAction.onPress}
            className="w-10 h-10 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={rightAction.accessibilityLabel}
          >
            {rightAction.icon}
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </SafeAreaView>
  );
}
