import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { queryClient } from "@/api";
import { useAuthMutation } from "@/api/auth/use-user-auth";
import { useIsNewUser } from "@/api/user";
import { ExternalLink } from "@/components/external-link";
import {
  Button,
  FocusAwareStatusBar,
  GoogleIcon,
  Image,
  Text,
  View,
} from "@/components/ui";
import {
  ReferralCodeModal,
  useReferralCodeModal,
} from "@/features/referral/components/LoginReferralModal";
import { useAuth, type SignInResult } from "@/lib/store/auth";

const TITLE_TEXT_SIZE = "text-5xl";

export default function Login() {
  const router = useRouter();
  const {
    signInWithGoogle,
    isAuthenticating,
    setBackendSession,
    referralUsed,
  } = useAuth();
  const referralModal = useReferralCodeModal();
  const authMutation = useAuthMutation();

  const [googleError, setGoogleError] = useState<string | undefined>();
  const [pendingGoogleResult, setPendingGoogleResult] =
    useState<SignInResult | null>(null);
  const [isCheckingNewUser, setIsCheckingNewUser] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleError(undefined);
    try {
      const result = await signInWithGoogle();
      if (!result?.userData?.user) {
        setGoogleError("Google user info missing. Please try again.");
        return;
      }

      const googleUser = result.userData.user;
      if (referralUsed) {
        // User already used a referral; skip asking again.
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
      setGoogleError("Google sign in failed. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralUsed, signInWithGoogle, referralModal]);

  const handleAuthComplete = useCallback(
    async (referralCode: string, resultOverride?: SignInResult) => {
      const googleResult = resultOverride ?? pendingGoogleResult;
      if (!googleResult?.userData?.user) {
        setGoogleError("Google user info missing. Please try again.");
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
        console.error(err);
        setGoogleError("Failed to complete sign in. Please try again.");
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

  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1 px-10 py-12 bg-[#F7F6F5] dark:bg-neutral-900">
        <View className="flex-1 justify-center items-center">
          {/* Big Image */}
          <Image
            source={require("@/assets/images/login-image.svg")}
            className="w-44 h-44 mb-8"
            contentFit="contain"
          />

          {/* Title */}
          <Text
            className={`text-center ${TITLE_TEXT_SIZE} font-matter text-primary mb-4 leading-[1.15] tracking-tighter`}
          >
            Welcome to Stacks{" "}
            <Text className={`${TITLE_TEXT_SIZE} text-tertiary`}>Mobile</Text>
          </Text>

          {/* Subtitle */}
          <Text className="text-center text-base font-instrument-sans text-secondary mb-8 px-4">
            Play games. Earn points. Start in seconds.
          </Text>

          {/* Button */}
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onPress={handleGoogleSignIn}
            loading={isAuthenticating || isCheckingNewUser}
            disabled={isAuthenticating || authMutation.isPending}
          >
            <View className="flex-row items-center justify-center gap-2">
              <GoogleIcon size={20} />
              <Text className="font-matter text-base text-primary">
                Continue with Google
              </Text>
            </View>
          </Button>

          {googleError && (
            <Text className="mt-4 text-center text-sm text-rose-400">
              {googleError}
            </Text>
          )}

          {authMutation.error && (
            <Text className="mt-4 text-center text-sm text-rose-400">
              {authMutation.error.message ||
                "Failed to complete sign in. Please try again."}
            </Text>
          )}

          {/* Terms and Conditions Subtitle */}
          <Text className="mt-8 text-center text-base text-secondary px-4 font-instrument-sans">
            By proceeding, you agree with{" "}
            <ExternalLink href="https://www.google.com">
              <Text className="text-primary underline">Terms of Use</Text>
            </ExternalLink>
          </Text>
        </View>
      </View>

      <ReferralCodeModal
        ref={referralModal.ref}
        onConfirm={handleAuthComplete}
        onSkip={() => handleAuthComplete("")}
        onDismiss={() => {
          setPendingGoogleResult(null);
          referralModal.onDismiss();
        }}
        loading={authMutation.isPending}
      />
    </>
  );
}
