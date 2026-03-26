import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "expo-router";

import {
  setAnalyticsEnabled,
  trackScreenView,
} from "@/lib/analytics/firebase-analytics";
import { needsConsentGate } from "@/lib/consent/types";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useAuth } from "@/lib/store/auth";
import { useConsentStore } from "@/lib/store/consent";

const CONSENT_OPTIONAL_ROUTES = new Set([
  "/login",
  "/privacy-consent",
  "/wallet-new",
  "/wallet-restore",
]);

export function ConsentController() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    backendUserData,
    hasHydrated: authHydrated,
    isAuthenticated,
  } = useAuth();
  const {
    applyUserContext,
    consent,
    hasHydrated: consentHydrated,
    hydrate,
    pendingSync,
  } = useConsentStore();
  const { syncPendingConsent } = useConsentActions();
  const attemptedSyncRef = useRef<string | null>(null);
  const screenTrackingRef = useRef<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!authHydrated || !consentHydrated) return;

    void applyUserContext(
      backendUserData?.id ?? null,
      backendUserData?.consent ?? null,
    );
  }, [
    applyUserContext,
    authHydrated,
    backendUserData?.consent,
    backendUserData?.id,
    consentHydrated,
  ]);

  const pendingSyncKey = useMemo(() => {
    if (!pendingSync) return null;
    return `${pendingSync.userId}:${pendingSync.localConsent.updatedAt}:${pendingSync.payload.version}`;
  }, [pendingSync]);

  useEffect(() => {
    if (
      !authHydrated ||
      !consentHydrated ||
      !isAuthenticated ||
      !pendingSyncKey
    ) {
      return;
    }

    if (attemptedSyncRef.current === pendingSyncKey) return;
    attemptedSyncRef.current = pendingSyncKey;

    void syncPendingConsent();
  }, [
    authHydrated,
    consentHydrated,
    isAuthenticated,
    pendingSyncKey,
    syncPendingConsent,
  ]);

  useEffect(() => {
    if (!consentHydrated) return;

    void setAnalyticsEnabled(consent?.analytics === true);
  }, [consent?.analytics, consentHydrated]);

  useEffect(() => {
    if (!pathname || screenTrackingRef.current === pathname) return;
    screenTrackingRef.current = pathname;
    void trackScreenView(pathname);
  }, [pathname]);

  useEffect(() => {
    if (!authHydrated || !consentHydrated || !isAuthenticated || !pathname) {
      return;
    }

    if (
      needsConsentGate(consent) &&
      pathname !== "/privacy-consent" &&
      !CONSENT_OPTIONAL_ROUTES.has(pathname)
    ) {
      router.replace("/privacy-consent");
      return;
    }

    if (!needsConsentGate(consent) && pathname === "/privacy-consent") {
      router.replace("/");
    }
  }, [
    authHydrated,
    consent,
    consentHydrated,
    isAuthenticated,
    pathname,
    router,
  ]);

  return null;
}
