import { useCallback } from "react";
import type { AuthProvider } from "@degenlab/stacks-wallet-kit-core";

import { useAuth } from "@/lib/store/auth";
import { walletKit } from "@/lib/stacks/wallet";

import { useHaptics } from "./use-haptics";

type GoogleWalletFlowOptions = {
  password: string;
};

function useAuthProvider(): AuthProvider {
  const { authMethod } = useAuth();
  return authMethod === "apple" ? "apple" : "google";
}

function useAuthCompletion() {
  const { completeAuth } = useAuth();
  return completeAuth;
}

function useWalletFlowHaptics() {
  const trigger = useHaptics();
  return trigger;
}

function logBackupFailure(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "failures" in error &&
    Array.isArray(error.failures)
  ) {
    console.error("Wallet backup provider failures", error.failures);
  }
}

export function useCreateWallet() {
  const authProvider = useAuthProvider();
  const completeAuth = useAuthCompletion();
  const triggerHaptics = useWalletFlowHaptics();

  const createWallet = useCallback(
    async ({ password }: GoogleWalletFlowOptions): Promise<void> => {
      try {
        await walletKit.createWallet();
        await walletKit.backupWallet(password, [authProvider]);
        completeAuth(true);
        triggerHaptics("success");
      } catch (error) {
        triggerHaptics("error");
        console.error("Failed to create wallet + backup", error);
        logBackupFailure(error);
        throw error;
      }
    },
    [authProvider, completeAuth, triggerHaptics],
  );

  return { createWallet };
}

export function useRestoreWallet() {
  const authProvider = useAuthProvider();
  const completeAuth = useAuthCompletion();
  const triggerHaptics = useWalletFlowHaptics();

  const restoreWallet = useCallback(
    async ({ password }: GoogleWalletFlowOptions): Promise<void> => {
      try {
        await walletKit.retrieveWalletFromProvider(password, authProvider);
        completeAuth(true);
        triggerHaptics("success");
      } catch (error) {
        triggerHaptics("error");
        console.error("Failed to restore wallet", error);
        throw error;
      }
    },
    [authProvider, completeAuth, triggerHaptics],
  );

  return { restoreWallet };
}

export function useDeleteGoogleBackup() {
  const authProvider = useAuthProvider();
  const triggerHaptics = useWalletFlowHaptics();

  const deleteBackup = useCallback(
    async (password: string) => {
      void password;
      try {
        await walletKit.deleteBackup(authProvider);
        triggerHaptics("success");
      } catch (error) {
        triggerHaptics("error");
        console.error("Failed to delete backup", error);
        throw error;
      }
    },
    [authProvider, triggerHaptics],
  );

  const deleteBackupWithoutPassword = useCallback(async () => {
    try {
      await walletKit.deleteBackup(authProvider);
      triggerHaptics("success");
    } catch (error) {
      triggerHaptics("error");
      console.error("Failed to delete backup without password", error);
      throw error;
    }
  }, [authProvider, triggerHaptics]);

  return { deleteBackup, deleteBackupWithoutPassword };
}
