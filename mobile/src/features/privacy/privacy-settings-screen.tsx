import { useEffect, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { AdsConsentPrivacyOptionsRequirementStatus } from "react-native-google-mobile-ads";

import { ScreenHeader, View } from "@/components/ui";
import { ConsentPreferencesForm } from "@/features/privacy/consent-preferences-form";
import { CURRENT_CONSENT_VERSION } from "@/lib/consent/types";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useAdsConsentStore } from "@/lib/store/ads-consent";
import { useAuth } from "@/lib/store/auth";
import { useConsentStore } from "@/lib/store/consent";

export default function PrivacySettingsScreen() {
  const { backendUserData } = useAuth();
  const { hasHydrated: consentHydrated, pendingSync } = useConsentStore();
  const consent = pendingSync?.localConsent ?? backendUserData?.consent ?? null;
  const { isSaving, saveConsent } = useConsentActions();
  const adsPersonalization = useAdsConsentStore(
    (state) => state.adsPersonalization,
  );
  const adsConsentLoading = useAdsConsentStore((state) => state.isLoading);
  const privacyOptionsRequirementStatus = useAdsConsentStore(
    (state) => state.privacyOptionsRequirementStatus,
  );
  const showPrivacyOptionsForm = useAdsConsentStore(
    (state) => state.showPrivacyOptionsForm,
  );
  const effectiveAdsPersonalization =
    adsPersonalization ?? consent?.adsPersonalization ?? false;

  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    consent?.analytics ?? false,
  );

  useEffect(() => {
    setAnalyticsEnabled(consent?.analytics ?? false);
  }, [consent?.analytics]);

  const handleSave = async (analytics: boolean) => {
    const result = await saveConsent({
      analytics,
      adsPersonalization: effectiveAdsPersonalization,
      version: CURRENT_CONSENT_VERSION,
    });

    showMessage({
      message: result.synced
        ? "Privacy preferences updated"
        : "Preferences saved locally",
      description: result.synced
        ? "Saved to your account."
        : "Saved locally for now. We will sync them to your account in the background.",
      type: result.synced ? "success" : "warning",
    });
  };

  const handleManageAdChoices = async () => {
    try {
      await showPrivacyOptionsForm();
      showMessage({
        message: "Ad choices updated",
        description: "Your Google ad consent settings were refreshed.",
        type: "success",
      });
    } catch {
      showMessage({
        message: "Could not open ad choices",
        description: "Please try again in a moment.",
        type: "warning",
      });
    }
  };

  if (!consentHydrated) {
    return null;
  }

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Privacy" />
      <ConsentPreferencesForm
        analyticsEnabled={analyticsEnabled}
        onAnalyticsChange={setAnalyticsEnabled}
        primaryLabel="Save analytics preference"
        onPrimaryPress={() => void handleSave(analyticsEnabled)}
        secondaryLabel="Turn off analytics"
        onSecondaryPress={() => void handleSave(false)}
        manageAdChoicesLabel="Manage ad choices"
        onManageAdChoices={
          privacyOptionsRequirementStatus ===
          AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
            ? () => void handleManageAdChoices()
            : undefined
        }
        manageAdChoicesLoading={adsConsentLoading}
        loading={isSaving}
        testIDPrefix="privacy-settings"
        withSafeArea={false}
      />
    </View>
  );
}
