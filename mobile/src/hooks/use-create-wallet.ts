import { useCallback } from "react";

import { useAuth } from "@/lib/store/auth";
import { walletKit } from "@/lib/wallet";

import { useHaptics } from "./use-haptics";

type GoogleWalletFlowOptions = {
  password: string;
};

function useGoogleAuthCompletion() {
  const { completeGoogleAuth } = useAuth();
  return completeGoogleAuth;
}

function useWalletFlowHaptics() {
  const trigger = useHaptics();
  return trigger;
}

export function useCreateWallet() {
  const completeGoogleAuth = useGoogleAuthCompletion();
  const triggerHaptics = useWalletFlowHaptics();

  const createWallet = useCallback(
    async ({ password }: GoogleWalletFlowOptions): Promise<void> => {
      try {
        await walletKit.createWallet(password);
        await walletKit.backupWallet(password);
        completeGoogleAuth(true);
        triggerHaptics("success");
      } catch (error) {
        triggerHaptics("error");
        console.error("Failed to create wallet + backup", error);
        throw error;
      }
    },
    [completeGoogleAuth, triggerHaptics],
  );

  return { createWallet };
}

export function useRestoreWallet() {
  const completeGoogleAuth = useGoogleAuthCompletion();
  const triggerHaptics = useWalletFlowHaptics();

  const restoreWallet = useCallback(
    async ({ password }: GoogleWalletFlowOptions): Promise<void> => {
      try {
        // walletKit handles all storage internally
        await walletKit.retrieveWallet(password);
        completeGoogleAuth(true);
        triggerHaptics("success");
      } catch (error) {
        triggerHaptics("error");
        console.error("Failed to restore wallet", error);
        throw error;
      }
    },
    [completeGoogleAuth, triggerHaptics],
  );

  return { restoreWallet };
}

export function useDeleteGoogleBackup() {
  const triggerHaptics = useWalletFlowHaptics();

  const deleteBackup = useCallback(
    async (password: string) => {
      try {
        await walletKit.deleteBackup(password);
        triggerHaptics("success");
      } catch (error) {
        triggerHaptics("error");
        console.error("Failed to delete backup", error);
        throw error;
      }
    },
    [triggerHaptics],
  );

  const deleteBackupWithoutPassword = useCallback(async () => {
    try {
      await walletKit.deleteBackupWithoutPassword();
      triggerHaptics("success");
    } catch (error) {
      triggerHaptics("error");
      console.error("Failed to delete backup without password", error);
      throw error;
    }
  }, [triggerHaptics]);

  return { deleteBackup, deleteBackupWithoutPassword };
}
