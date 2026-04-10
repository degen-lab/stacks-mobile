import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { showMessage } from "react-native-flash-message";

import { FocusAwareStatusBar, useModal, View } from "@/components/ui";
import { AnalyticsConsentModal } from "@/features/privacy/analytics-consent-modal";
import { CURRENT_CONSENT_VERSION, needsConsentGate } from "@/lib/consent/types";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useAdsConsentStore } from "@/lib/store/ads-consent";
import { useAuth } from "@/lib/store/auth";
import { useConsentStore } from "@/lib/store/consent";

export default function PrivacyConsentScreen() {
  const router = useRouter();
  const { backendUserData, isAuthenticated, hasHydrated } = useAuth();
  const { hasHydrated: consentHydrated, pendingSync } = useConsentStore();
  const consent = pendingSync?.localConsent ?? backendUserData?.consent ?? null;
  const { isSaving, saveConsent } = useConsentActions();
  const analyticsModal = useModal();
  const modalPresentedRef = useRef(false);
  const decisionMadeRef = useRef(false);

  // UMP must resolve before we show the modal so adsPersonalization is known.
  const umpResolved = useAdsConsentStore((state) => state.hasResolved);
  const adsPersonalization = useAdsConsentStore(
    (state) => state.adsPersonalization,
  );

  useEffect(() => {
    if (!hasHydrated || !consentHydrated || !umpResolved) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!backendUserData) return;
    if (!needsConsentGate(consent)) {
      router.replace("/");
      return;
    }
    if (modalPresentedRef.current) return;
    modalPresentedRef.current = true;
    analyticsModal.present();
  }, [
    analyticsModal,
    backendUserData,
    consentHydrated,
    consent,
    hasHydrated,
    isAuthenticated,
    umpResolved,
    router,
  ]);

  const handleModalDismiss = () => {
    if (!decisionMadeRef.current) {
      void handleDecision(false);
    }
  };

  const handleDecision = async (analytics: boolean) => {
    decisionMadeRef.current = true;
    // adsPersonalization comes from UMP — null means not required (non-EEA),
    // treated as false (standard ads, no personalization assumed).
    const result = await saveConsent({
      analytics,
      adsPersonalization: adsPersonalization ?? false,
      version: CURRENT_CONSENT_VERSION,
    });

    if (!result.synced) {
      showMessage({
        message: "Preferences saved locally",
        description:
          "We could not sync them yet. The app will retry in the background.",
        type: "warning",
      });
    }

    router.replace("/");
  };

  return (
    <>
      <FocusAwareStatusBar />
      <View className="flex-1 bg-surface-tertiary" />
      <AnalyticsConsentModal
        modalRef={analyticsModal.ref}
        onAllow={() => void handleDecision(true)}
        onDecline={() => void handleDecision(false)}
        onDismiss={handleModalDismiss}
        loading={isSaving}
      />
    </>
  );
}
