import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Platform } from "react-native";

import { queryClient } from "@/api";
import { useAuthMutation } from "@/api/auth/use-user-auth";
import { useIsNewUser } from "@/api/user";
import { useUserProfile } from "@/api/user/use-user-profile";
import { showError, showErrorMessage } from "@/components/ui/utils";
import {
  ReferralCodeModal,
  useReferralCodeModal,
} from "@/features/login/components/referral-modal";
import { useAuth, type SignInResult } from "@/lib/store/auth";

import LoginLayout from "./Login.layout";

export default function LoginScreen() {
  const router = useRouter();
  const {
    signInWithGoogle,
    signInWithApple,
    isAuthenticating,
    setBackendSession,
    setBackendUserData,
    referralUsed,
  } = useAuth();
  const referralModal = useReferralCodeModal();
  const authMutation = useAuthMutation();

  const [pendingSignInResult, setPendingSignInResult] =
    useState<SignInResult | null>(null);
  const [isCheckingNewUser, setIsCheckingNewUser] = useState(false);
  const [activeProvider, setActiveProvider] = useState<
    "google" | "apple" | null
  >(null);

  const handleAuthComplete = useCallback(
    async (referralCode: string, resultOverride?: SignInResult) => {
      const signInResult = resultOverride ?? pendingSignInResult;
      if (!signInResult?.userData) {
        showErrorMessage("User info missing. Please try again.");
        referralModal.dismiss();
        return;
      }

      const authUser = signInResult.userData;
      const trimmedReferralCode = referralCode.trim();

      try {
        const response = await authMutation.mutateAsync({
          googleId: authUser.id,
          nickName: authUser.name || authUser.givenName || "",
          photoUri: authUser.photo || undefined,
          referralCode: trimmedReferralCode || undefined,
        });
        await setBackendSession(response.token, response.data, true);
        await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        const profile = await queryClient.fetchQuery(
          useUserProfile.getFetchOptions(),
        );
        await setBackendUserData({
          ...response.data,
          nickname: profile.nickname,
          points: profile.points,
          streak: profile.streak,
          referralCode: profile.referralCode,
          consent: profile.consent,
        });

        const nextRoute = signInResult.hasBackup
          ? "/wallet-restore"
          : "/wallet-new";

        referralModal.dismissWithCallback(() => {
          router.replace(nextRoute);
        });
      } catch (err) {
        if (isAxiosError(err)) {
          showError(err);
        } else {
          showErrorMessage("Failed to complete sign in. Please try again.");
        }
      }
    },
    [
      authMutation,
      pendingSignInResult,
      referralModal,
      router,
      setBackendSession,
      setBackendUserData,
    ],
  );

  const handleProviderSignIn = useCallback(
    async (provider: "google" | "apple") => {
      if (isAuthenticating || isCheckingNewUser || authMutation.isPending)
        return;

      setActiveProvider(provider);
      try {
        const result =
          provider === "apple"
            ? await signInWithApple()
            : await signInWithGoogle();
        if (!result?.userData) {
          showErrorMessage(
            `${provider === "apple" ? "Apple" : "Google"} user info missing. Please try again.`,
          );
          return;
        }

        const authUser = result.userData;
        if (referralUsed) {
          await handleAuthComplete("", result);
          return;
        }

        setPendingSignInResult(result);
        setIsCheckingNewUser(true);
        try {
          const data = await queryClient.fetchQuery(
            useIsNewUser.getFetchOptions({ googleId: authUser.id }),
          );
          if (data.isNewUser) {
            referralModal.present();
          } else {
            await handleAuthComplete("", result);
          }
        } catch (err) {
          console.error(err);
          await handleAuthComplete("", result);
        } finally {
          setIsCheckingNewUser(false);
        }
      } catch (err) {
        console.error(err);
        showErrorMessage(
          `${provider === "apple" ? "Apple" : "Google"} sign in failed. Please try again.`,
        );
      } finally {
        setActiveProvider(null);
      }
    },
    [
      authMutation.isPending,
      handleAuthComplete,
      isAuthenticating,
      isCheckingNewUser,
      referralModal,
      referralUsed,
      signInWithApple,
      signInWithGoogle,
    ],
  );

  const handleGoogleSignIn = useCallback(
    () => handleProviderSignIn("google"),
    [handleProviderSignIn],
  );

  const handleAppleSignIn = useCallback(
    () => handleProviderSignIn("apple"),
    [handleProviderSignIn],
  );

  return (
    <>
      <LoginLayout
        onGoogleSignIn={handleGoogleSignIn}
        onAppleSignIn={handleAppleSignIn}
        showAppleSignIn={Platform.OS === "ios"}
        isGoogleLoading={
          activeProvider === "google" ||
          (isAuthenticating && activeProvider === null)
        }
        isAppleLoading={activeProvider === "apple"}
        isDisabled={
          isAuthenticating || isCheckingNewUser || authMutation.isPending
        }
      />
      <ReferralCodeModal
        ref={referralModal.ref}
        onConfirm={handleAuthComplete}
        onSkip={() => void handleAuthComplete("")}
        onDismiss={() => {
          referralModal.onDismiss();
          void handleAuthComplete("");
        }}
        loading={authMutation.isPending}
      />
    </>
  );
}
