import { Pressable, Text, View, colors } from "@/components/ui";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
    accessibilityLabel: string;
  };
};

export function ScreenHeader({
  title,
  onBack,
  rightAction,
}: ScreenHeaderProps) {
  const router = useRouter();
  const navigation = useNavigation();

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
      <View className="flex-row items-center px-5 py-4 border-b border-surface-secondary">
        <Pressable
          onPress={handleBack}
          className="w-10 h-10 items-center justify-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.neutral[900]} />
        </Pressable>

        <Text className="text-xl font-matter text-primary flex-1 text-center">
          {title}
        </Text>

        {rightAction ? (
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
