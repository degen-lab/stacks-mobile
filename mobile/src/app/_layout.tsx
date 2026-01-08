import "../../global.css";
import "../../polyfill";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { APIProvider } from "@/api";
import { ReferralHeader } from "@/features/referral/components/ReferralHeader";
import { useAppBootstrap } from "@/lib/app/use-app-bootstrap";
import { fontConfig } from "@/lib/fonts";
import { useThemeConfig } from "@/lib/theme/use-theme-config";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontConfig);
  const isAppReady = useAppBootstrap();

  useEffect(() => {
    if (isAppReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [isAppReady, fontsLoaded, fontError]);

  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        {/* <Stack.Screen name="onboarding" options={{ headerShown: false }} /> */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="stacks-bridge" options={{ headerShown: false }} />
        <Stack.Screen name="wallet-new" options={{ headerShown: false }} />
        <Stack.Screen name="wallet-restore" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings/accounts"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="settings/display"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
        <Stack.Screen
          name="referral"
          options={{
            header: () => <ReferralHeader />,
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="leaderboard"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </Providers>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const theme = useThemeConfig();
  return (
    <GestureHandlerRootView className={`flex-1 ${theme.dark ? "dark" : ""}`}>
      <KeyboardProvider>
        <ThemeProvider value={theme}>
          <APIProvider>
            <BottomSheetModalProvider>
              {children}
              <FlashMessage position="top" />
            </BottomSheetModalProvider>
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
