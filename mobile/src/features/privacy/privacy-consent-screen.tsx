import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { showMessage } from "react-native-flash-message";

import { FocusAwareStatusBar, useModal } from "@/components/ui";
import { AnalyticsConsentModal } from "@/features/privacy/analytics-consent-modal";
import { PrivacyConsentOnboarding } from "@/features/privacy/privacy-consent-onboarding";
import { CURRENT_CONSENT_VERSION, needsConsentGate } from "@/lib/consent/types";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useAuth } from "@/lib/store/auth";
import { useConsentStore } from "@/lib/store/consent";

export default function PrivacyConsentScreen() {
  const router = useRouter();
  const { backendUserData, isAuthenticated, hasHydrated } = useAuth();
  const { hasHydrated: consentHydrated, pendingSync } = useConsentStore();
  const consent = pendingSync?.localConsent ?? backendUserData?.consent ?? null;
  const { isSaving, saveConsent } = useConsentActions();
  const analyticsModal = useModal();
  const analyticsModalPresentedRef = useRef(false);
  const [analyticsDecision, setAnalyticsDecision] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    if (!hasHydrated || !consentHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!backendUserData) return;
    if (!needsConsentGate(consent)) {
      router.replace("/");
      return;
    }
    if (analyticsModalPresentedRef.current) return;
    analyticsModalPresentedRef.current = true;
    analyticsModal.present();
  }, [
    analyticsModal,
    backendUserData,
    consentHydrated,
    consent,
    hasHydrated,
    isAuthenticated,
    router,
  ]);

  const handleAnalyticsDecision = (allow: boolean) => {
    setAnalyticsDecision(allow);
    analyticsModal.dismiss();
  };

  const handleAdsDecision = async (adsPersonalization: boolean) => {
    const result = await saveConsent({
      analytics: analyticsDecision ?? false,
      adsPersonalization,
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

  if (!hasHydrated || !consentHydrated || !backendUserData) {
    return null;
  }

  return (
    <>
      <FocusAwareStatusBar />
      <PrivacyConsentOnboarding
        onEnable={() => void handleAdsDecision(true)}
        onSkip={() => void handleAdsDecision(false)}
        loading={isSaving}
      />
      <AnalyticsConsentModal
        modalRef={analyticsModal.ref}
        onAllow={() => handleAnalyticsDecision(true)}
        onDecline={() => handleAnalyticsDecision(false)}
      />
    </>
  );
}
