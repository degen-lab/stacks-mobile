import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

import { FocusAwareStatusBar } from "@/components/ui";
import { GooglePasswordScreen } from "@/features/login/components/google-password-screen";
import { useCreateWallet } from "@/hooks/use-create-wallet";
import { useAuth } from "@/lib/store/auth";

export default function WalletNew() {
  const router = useRouter();
  const { createWallet } = useCreateWallet();
  const { signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateWallet = useCallback(async () => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      await createWallet({ password });
      router.replace("/");
    } catch (err) {
      console.error("Failed to create or backup wallet:", err);
      setError("Wallet creation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [createWallet, password, router]);

  const handleBack = useCallback(async () => {
    await signOut();
    router.replace("/login");
  }, [signOut, router]);

  return (
    <>
      <FocusAwareStatusBar />
      <GooglePasswordScreen
        mode="create"
        password={password}
        onPasswordChange={setPassword}
        onContinue={handleCreateWallet}
        onBack={handleBack}
        error={error}
        isLoading={isSubmitting}
      />
    </>
  );
}
