import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "expo-router";

import {
  clearUserContext,
  setEnabled,
  setUserContext,
  trackEvent,
  trackScreen,
} from "@/lib/analytics";
import { needsConsentGate } from "@/lib/consent/types";
import { Env } from "@/lib/env";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useAdsConsentStore } from "@/lib/store/ads-consent";
import { useAuth } from "@/lib/store/auth";
import { resetConsentStore, useConsentStore } from "@/lib/store/consent";

export function ConsentController() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    backendUserData,
    hasHydrated: authHydrated,
    hasBackup,
    isAuthenticated,
  } = useAuth();
  const { hasHydrated: consentHydrated, pendingSync } = useConsentStore();
  const { syncPendingConsent } = useConsentActions();
  const umpAdsPersonalization = useAdsConsentStore(
    (state) => state.adsPersonalization,
  );

  const ready = authHydrated && consentHydrated;
  const consent = pendingSync?.localConsent ?? backendUserData?.consent ?? null;
  const analyticsEnabled =
    consent?.analytics === true && isAuthenticated && !!backendUserData;

  const attemptedSyncRef = useRef<string | null>(null);
  const screenTrackingRef = useRef<string | null>(null);
  const prevAnalyticsEnabledRef = useRef<boolean | null>(null);
  const prevIsAuthenticatedRef = useRef<boolean | null>(null);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Retry any consent that failed to sync to the backend
  useEffect(() => {
    if (!ready || !isAuthenticated || !pendingSync) return;
    const key = `${pendingSync.userId}:${pendingSync.localConsent.updatedAt}:${pendingSync.payload.version}`;
    if (attemptedSyncRef.current === key) return;
    attemptedSyncRef.current = key;
    void syncPendingConsent();
  }, [ready, isAuthenticated, pendingSync, syncPendingConsent]);

  // Analytics enable/disable + user identity
  useEffect(() => {
    if (!ready) return;
    const prevEnabled = prevAnalyticsEnabledRef.current;
    prevAnalyticsEnabledRef.current = analyticsEnabled;

    void setEnabled(analyticsEnabled);
    if (!analyticsEnabled || !backendUserData) {
      void clearUserContext();
      return;
    }
    void setUserContext({
      userId: String(backendUserData.id),
      app_env: Env.APP_ENV,
      network: Env.NETWORK,
      auth_method: "google",
      has_backup: hasBackup,
    });
    if (prevEnabled === false) {
      void trackEvent("consent_saved", {
        analytics_enabled: consent?.analytics ?? false,
        ads_personalization_enabled:
          umpAdsPersonalization ?? consent?.adsPersonalization ?? false,
      });
    }
    const currentPathname = pathnameRef.current;
    if (screenTrackingRef.current !== currentPathname) {
      screenTrackingRef.current = currentPathname;
      void trackScreen(currentPathname);
    }
  }, [
    ready,
    analyticsEnabled,
    backendUserData,
    hasBackup,
    consent,
    umpAdsPersonalization,
  ]);

  // Screen tracking on navigation
  useEffect(() => {
    if (!pathname || screenTrackingRef.current === pathname) return;
    screenTrackingRef.current = pathname;
    void trackScreen(pathname);
  }, [pathname]);

  // Consent gate routing
  useEffect(() => {
    if (!ready || !isAuthenticated || !backendUserData || !pathname) return;
    if (needsConsentGate(consent) && pathname !== "/privacy-consent") {
      router.replace("/privacy-consent");
      return;
    }
    if (!needsConsentGate(consent) && pathname === "/privacy-consent") {
      router.replace("/");
    }
  }, [ready, isAuthenticated, backendUserData, pathname, consent, router]);

  // Sign-out cleanup
  useEffect(() => {
    if (prevIsAuthenticatedRef.current === true && !isAuthenticated) {
      void resetConsentStore();
    }
    prevIsAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return null;
}
