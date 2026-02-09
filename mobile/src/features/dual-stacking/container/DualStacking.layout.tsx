import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { View } from "@/components/ui";
import TopSectionContainer from "../components/cards/container/TopSection";

export default function DualStackingLayout() {
  return (
    <SafeAreaView className="bg-surface-tertiary" edges={["bottom"]}>
      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 24, gap: 24 }}
      >
        <TopSectionContainer />

        <View className="py-4"></View>
      </ScrollView>
    </SafeAreaView>
  );
}
