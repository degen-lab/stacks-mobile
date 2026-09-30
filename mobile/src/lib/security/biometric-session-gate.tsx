import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { Button, SafeAreaView, Text, View } from "@/components/ui";
import { LockIcon } from "@/components/ui/icons/lock-icon";
import { useAuth } from "@/lib/store/auth";
import { useSecurityMethod } from "@/lib/store/settings";

import { authenticateWithBiometrics } from "./local-auth";

const DEFAULT_MESSAGE =
  "Use your device biometrics to unlock the wallet for this session.";

export function BiometricSessionGate() {
  const { isAuthenticated } = useAuth();
  const { securityMethod } = useSecurityMethod();
  const shouldRequireBiometrics =
    isAuthenticated && securityMethod === "biometrics";

  // Derived unlock state: if biometrics not required, always considered unlocked.
  // This avoids a flash where isUnlocked=true while shouldRequireBiometrics
  // has just become true (between store hydration and the effect firing).
  const [isSessionUnlocked, setIsSessionUnlocked] = useState(false);
  const isUnlocked = !shouldRequireBiometrics || isSessionUnlocked;

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const previousShouldRequireRef = useRef(false);
  const shouldRequireRef = useRef(shouldRequireBiometrics);
  const isAuthenticatingRef = useRef(false);

  useEffect(() => {
    shouldRequireRef.current = shouldRequireBiometrics;
  }, [shouldRequireBiometrics]);

  useEffect(() => {
    isAuthenticatingRef.current = isAuthenticating;
  }, [isAuthenticating]);

  const requestUnlock = useCallback(async () => {
    if (!shouldRequireRef.current || isAuthenticatingRef.current) {
      return;
    }

    setIsAuthenticating(true);
    setStatusMessage(null);

    const result = await authenticateWithBiometrics({
      promptMessage: "Unlock wallet",
    });

    setIsAuthenticating(false);

    if (result.success) {
      setIsSessionUnlocked(true);
      setStatusMessage(null);
    } else {
      setStatusMessage(result.message);
    }
  }, []);

  // Auto-prompt when biometrics requirement turns on for the first time,
  // and reset session when it turns off.
  useEffect(() => {
    if (!shouldRequireBiometrics) {
      setIsSessionUnlocked(false);
      setStatusMessage(null);
      previousShouldRequireRef.current = false;
      return;
    }

    if (!previousShouldRequireRef.current) {
      void requestUnlock();
    }

    previousShouldRequireRef.current = true;
  }, [shouldRequireBiometrics, requestUnlock]);

  // Lock and re-prompt when app resumes from background.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (!shouldRequireRef.current || isAuthenticatingRef.current) {
        return;
      }

      const resumedToActive =
        nextState === "active" && previousState === "background";

      if (!resumedToActive) {
        return;
      }

      setIsSessionUnlocked(false);
      setStatusMessage(null);
      void requestUnlock();
    });

    return () => subscription.remove();
  }, [requestUnlock]);

  if (isUnlocked) {
    return null;
  }

  return (
    <View className="absolute inset-0 z-50 bg-surface-tertiary">
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6 h-16 w-16 items-center justify-center rounded-full bg-surface-primary">
            <LockIcon size={28} color="#595754" />
          </View>

          <Text className="text-center font-matter text-3xl text-primary">
            Wallet locked
          </Text>
          <Text className="mt-3 text-center font-instrument-sans text-base leading-6 text-secondary">
            {statusMessage ?? DEFAULT_MESSAGE}
          </Text>

          <Button
            variant="primaryNavbar"
            size="lg"
            label="Unlock with biometrics"
            disabled={isAuthenticating}
            onPress={() => void requestUnlock()}
            className="mt-10 rounded-full"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
