import { useEffect, useRef } from "react";

import { initializeAds } from "@/lib/ads/initialize-ads";
import { isAnalyticsConsentCurrent } from "@/lib/consent/types";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useAuth } from "@/lib/store/auth";
import { useAdsConsentStore } from "@/lib/store/ads-consent";
import { useConsentStore } from "@/lib/store/consent";

export function AdsConsentController() {
  const syncConsentInfo = useAdsConsentStore((state) => state.syncConsentInfo);
  const hasResolved = useAdsConsentStore((state) => state.hasResolved);
  const canRequestAds = useAdsConsentStore((state) => state.canRequestAds);
  const adsPersonalization = useAdsConsentStore(
    (state) => state.adsPersonalization,
  );
  const isMobileAdsInitialized = useAdsConsentStore(
    (state) => state.isMobileAdsInitialized,
  );
  const setMobileAdsInitialized = useAdsConsentStore(
    (state) => state.setMobileAdsInitialized,
  );
  const { backendUserData, isAuthenticated } = useAuth();
  const pendingSync = useConsentStore((state) => state.pendingSync);
  const { syncAdsPersonalizationMirror } = useConsentActions();
  const hasStartedRef = useRef(false);
  const hasAttemptedInitRef = useRef(false);
  const attemptedMirrorKeyRef = useRef<string | null>(null);
  const consent = pendingSync?.localConsent ?? backendUserData?.consent ?? null;

  useEffect(() => {
    if (hasStartedRef.current || hasResolved) {
      return;
    }

    hasStartedRef.current = true;
    syncConsentInfo({ loadAndShowFormIfRequired: true }).catch((error) => {
      console.error("[AdsConsent] UMP sync failed:", error);
    });
  }, [hasResolved, syncConsentInfo]);

  useEffect(() => {
    if (
      !hasResolved ||
      !canRequestAds ||
      isMobileAdsInitialized ||
      hasAttemptedInitRef.current
    ) {
      return;
    }

    hasAttemptedInitRef.current = true;

    initializeAds()
      .then((initialized) => {
        if (!initialized) {
          // Allow one retry on the next canRequestAds trigger.
          hasAttemptedInitRef.current = false;
        }
        setMobileAdsInitialized(initialized);
      })
      .catch((error) => {
        hasAttemptedInitRef.current = false;
        console.error("[AdsConsent] Mobile Ads init failed:", error);
      });
  }, [
    canRequestAds,
    hasResolved,
    isMobileAdsInitialized,
    setMobileAdsInitialized,
  ]);

  useEffect(() => {
    if (
      !hasResolved ||
      !isAuthenticated ||
      !backendUserData ||
      !consent ||
      adsPersonalization === null ||
      !isAnalyticsConsentCurrent(consent)
    ) {
      return;
    }

    if (consent.adsPersonalization === adsPersonalization) {
      return;
    }

    const key = `${backendUserData.id}:${consent.analytics}:${consent.version}:${adsPersonalization}`;
    if (attemptedMirrorKeyRef.current === key) {
      return;
    }

    attemptedMirrorKeyRef.current = key;
    void syncAdsPersonalizationMirror(adsPersonalization);
  }, [
    adsPersonalization,
    backendUserData,
    consent,
    hasResolved,
    isAuthenticated,
    syncAdsPersonalizationMirror,
  ]);

  return null;
}
