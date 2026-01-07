import { ScreenHeader, Text, View } from "@/components/ui";
import { ScrollView } from "react-native";

export default function DisplaySettingsScreen() {
  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Display" />
      <ScrollView className="flex-1 px-4 pt-5">
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-lg font-instrument-sans text-secondary text-center">
            This section will be added soon.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
