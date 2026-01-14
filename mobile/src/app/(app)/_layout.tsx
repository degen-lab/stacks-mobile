import { HapticTab } from "@/components/haptic-tab";
import { EarnIcon, GamepadIcon, HomeIcon } from "@/components/ui/icons";
import { Header } from "@/features/header";
import { useAuth } from "@/lib/store/auth";
import { Redirect, Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { isAuthenticated, hasHydrated } = useAuth();
  const insets = useSafeAreaInsets();
  const androidBottomInset =
    Platform.OS === "android" ? Math.max(insets.bottom, 12) : 0;

  if (!hasHydrated) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        header: () => <Header />,
        tabBarActiveTintColor: "#FC6432",
        tabBarInactiveTintColor: "#5E5F60",
        tabBarStyle: {
          backgroundColor: "#EAE8E6",
          borderTopWidth: 0,
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
          elevation: 0,
          height: 90 + androidBottomInset,
          paddingBottom: androidBottomInset,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "InstrumentSans-Medium",
          marginTop: 2,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarButton: (props) => <HapticTab {...props} />,
          tabBarIcon: ({ focused }) => (
            <HomeIcon color={focused ? "#FC6432" : "#5E5F60"} />
          ),
        }}
      />

      <Tabs.Screen
        name="Play"
        options={{
          title: "Play",
          tabBarButton: (props) => <HapticTab {...props} />,
          tabBarIcon: ({ focused }) => (
            <GamepadIcon color={focused ? "#FC6432" : "#5E5F60"} />
          ),
        }}
      />
      <Tabs.Screen
        name="Earn"
        options={{
          title: "Earn",
          tabBarButton: (props) => <HapticTab {...props} />,
          tabBarIcon: ({ focused }) => (
            <EarnIcon color={focused ? "#FC6432" : "#5E5F60"} />
          ),
        }}
      />
    </Tabs>
  );
}
