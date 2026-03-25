import { Stack } from "expo-router";

export default function EarnLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Tab layout already provides shared Header
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#F5F3F1" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="stacking"
        options={{
          title: "Stack STX",
        }}
      />
      <Stack.Screen
        name="dual-stacking"
        options={{
          title: "Dual Stacking",
        }}
      />
      <Stack.Screen
        name="assets/[assetId]"
        options={{
          title: "Asset",
        }}
      />
      <Stack.Screen
        name="bridge"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
