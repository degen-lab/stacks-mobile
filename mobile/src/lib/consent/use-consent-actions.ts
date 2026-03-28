import { useCallback } from "react";

import { queryClient } from "@/api/common/api-provider";
import { useUpdateUserConsent } from "@/api/user";
import type { UserProfile } from "@/api/user/types";
import type { ConsentDecision, ConsentDto } from "@/lib/consent/types";
import { createLocalConsent } from "@/lib/consent/types";
import { useAuth } from "@/lib/store/auth";
import { useConsentStore } from "@/lib/store/consent";

function updateUserProfileConsent(consent: ConsentDto) {
  queryClient.setQueryData<UserProfile>(["user-profile"], (previous) => {
    if (!previous) return previous;
    return {
      ...previous,
      consent,
    };
  });
}

export function useConsentActions() {
  const updateConsentMutation = useUpdateUserConsent();
  const { backendUserData, setBackendUserData } = useAuth();
  const { setPendingSync, clearPendingSync } = useConsentStore();
  const userId = backendUserData?.id ?? null;

  const saveConsent = useCallback(
    async (decision: ConsentDecision) => {
      if (!userId) {
        throw new Error("Authenticated user data is not available.");
      }

      const localConsent = createLocalConsent(decision);

      try {
        const response = await updateConsentMutation.mutateAsync(decision);
        const savedConsent = response.data;
        await clearPendingSync();
        updateUserProfileConsent(savedConsent);
        if (backendUserData) {
          await setBackendUserData({
            ...backendUserData,
            consent: savedConsent,
          });
        }
        return { consent: savedConsent, synced: true } as const;
      } catch (error) {
        await setPendingSync(userId, decision, localConsent);
        return { consent: localConsent, synced: false, error } as const;
      }
    },
    [
      backendUserData,
      clearPendingSync,
      setPendingSync,
      setBackendUserData,
      updateConsentMutation,
      userId,
    ],
  );

  const syncPendingConsent = useCallback(async () => {
    const pendingSync = useConsentStore.getState().pendingSync;

    if (!pendingSync || pendingSync.userId !== userId) {
      return null;
    }

    try {
      const response = await updateConsentMutation.mutateAsync(
        pendingSync.payload,
      );
      const savedConsent = response.data;
      await clearPendingSync();
      updateUserProfileConsent(savedConsent);
      if (backendUserData) {
        await setBackendUserData({ ...backendUserData, consent: savedConsent });
      }
      return savedConsent;
    } catch (error) {
      console.warn("Failed to sync pending consent:", error);
      return null;
    }
  }, [
    backendUserData,
    clearPendingSync,
    setBackendUserData,
    updateConsentMutation,
    userId,
  ]);

  return {
    isSaving: updateConsentMutation.isPending,
    saveConsent,
    syncPendingConsent,
  };
}
