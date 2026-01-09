import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { queryClient } from "@/api";
import { useAuthMutation } from "@/api/auth/use-user-auth";
import { useIsNewUser } from "@/api/user";
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
    isAuthenticating,
    setBackendSession,
    referralUsed,
  } = useAuth();
  const referralModal = useReferralCodeModal();
  const authMutation = useAuthMutation();

  const [pendingGoogleResult, setPendingGoogleResult] =
    useState<SignInResult | null>(null);
  const [isCheckingNewUser, setIsCheckingNewUser] = useState(false);

  const handleAuthComplete = useCallback(
    async (referralCode: string, resultOverride?: SignInResult) => {
      const googleResult = resultOverride ?? pendingGoogleResult;
      if (!googleResult?.userData?.user) {
        showErrorMessage("Google user info missing. Please try again.");
        referralModal.dismiss();
        return;
      }

      const googleUser = googleResult.userData.user;

      try {
        const response = await authMutation.mutateAsync({
          googleId: googleUser.id,
          nickName: googleUser.name || googleUser.givenName || "",
          photoUri: googleUser.photo || undefined,
          referralCode: referralCode || undefined,
        });
        await setBackendSession(response.token, response.data, true);

        const nextRoute = googleResult.hasBackup
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
      pendingGoogleResult,
      referralModal,
      router,
      setBackendSession,
    ],
  );

  const handleGoogleSignIn = useCallback(async () => {
    if (isAuthenticating || isCheckingNewUser || authMutation.isPending) return;
    try {
      const result = await signInWithGoogle();
      if (!result?.userData?.user) {
        showErrorMessage("Google user info missing. Please try again.");
        return;
      }

      const googleUser = result.userData.user;
      if (referralUsed) {
        handleAuthComplete("", result);
        return;
      }

      setPendingGoogleResult(result);
      setIsCheckingNewUser(true);
      try {
        const data = await queryClient.fetchQuery(
          useIsNewUser.getFetchOptions({ googleId: googleUser.id }),
        );
        if (data.isNewUser) {
          referralModal.present();
        } else {
          handleAuthComplete("", result);
        }
      } catch (err) {
        console.error(err);
        handleAuthComplete("", result);
      } finally {
        setIsCheckingNewUser(false);
      }
    } catch (err) {
      console.error(err);
      showErrorMessage("Google sign in failed. Please try again.");
    }
  }, [
    authMutation.isPending,
    handleAuthComplete,
    isAuthenticating,
    isCheckingNewUser,
    referralModal,
    referralUsed,
    signInWithGoogle,
  ]);

  return (
    <>
      <LoginLayout
        onGoogleSignIn={handleGoogleSignIn}
        isLoading={isAuthenticating || isCheckingNewUser}
        isDisabled={isAuthenticating || authMutation.isPending}
      />
      <ReferralCodeModal
        ref={referralModal.ref}
        onConfirm={handleAuthComplete}
        onSkip={() => handleAuthComplete("")}
        onDismiss={() => {
          referralModal.onDismiss();
          handleAuthComplete("");
        }}
        loading={authMutation.isPending}
      />
    </>
  );
}
