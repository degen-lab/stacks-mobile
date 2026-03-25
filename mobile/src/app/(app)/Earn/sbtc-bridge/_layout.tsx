import { Stack } from "expo-router";

export default function BridgeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "#F5F3F1" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="activity" />
      <Stack.Screen name="deposit/[txid]" />
      <Stack.Screen name="deposit/[txid]/reclaim" />
      <Stack.Screen name="withdraw/[id]" />
    </Stack>
  );
}
