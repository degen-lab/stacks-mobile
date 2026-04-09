import "../../global.css";
import "../../polyfill";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { APIProvider } from "@/api";
import { ReferralHeader } from "@/features/referral/components/referral-header";
import { SwapSheetProvider } from "@/features/swaps";
import { TransferSheetProvider } from "@/features/transfer";
import { useAppBootstrap } from "@/lib/app/use-app-bootstrap";
import { ConsentController } from "@/lib/consent/consent-controller";
import { fontConfig } from "@/lib/fonts";
import { BiometricSessionGate } from "@/lib/security/biometric-session-gate";
import { useThemeConfig } from "@/lib/theme/use-theme-config";
import { darkThemeVars, lightThemeVars } from "@/lib/theme/theme-vars";

import { TransakProvider } from "@/features/transak/context/transak-context";

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

  // Don't mount app until auth (and token) are hydrated — avoids 401 on refresh
  if (!isAppReady) {
    return null;
  }

  return (
    <Providers>
      <ConsentController />
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        {/* <Stack.Screen name="onboarding" options={{ headerShown: false }} /> */}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="privacy-consent" options={{ headerShown: false }} />
        <Stack.Screen name="stacks-bridge" options={{ headerShown: false }} />
        <Stack.Screen name="wallet-new" options={{ headerShown: false }} />
        <Stack.Screen name="wallet-restore" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings/accounts/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="settings/accounts/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="settings/privacy-ads"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="settings/delete-account"
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
      <SafeAreaProvider>
        <View
          style={[{ flex: 1 }, theme.dark ? darkThemeVars : lightThemeVars]}
        >
          <KeyboardProvider>
            <ThemeProvider value={theme}>
              <APIProvider>
                <BottomSheetModalProvider>
                  <TransferSheetProvider>
                    <SwapSheetProvider>
                      <TransakProvider>{children}</TransakProvider>
                    </SwapSheetProvider>
                  </TransferSheetProvider>
                  <FlashMessageHost />
                  <BiometricSessionGate />
                </BottomSheetModalProvider>
              </APIProvider>
            </ThemeProvider>
          </KeyboardProvider>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function FlashMessageHost() {
  const insets = useSafeAreaInsets();

  return <FlashMessage position="top" statusBarHeight={insets.top} />;
}
