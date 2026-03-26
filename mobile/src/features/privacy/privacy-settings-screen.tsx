import { useEffect, useState } from "react";
import { showMessage } from "react-native-flash-message";

import { ScreenHeader, View } from "@/components/ui";
import { ConsentPreferencesForm } from "@/features/privacy/consent-preferences-form";
import { CURRENT_CONSENT_VERSION } from "@/lib/consent/types";
import { useConsentActions } from "@/lib/consent/use-consent-actions";
import { useConsentStore } from "@/lib/store/consent";

export default function PrivacySettingsScreen() {
  const consent = useConsentStore((state) => state.consent);
  const consentHydrated = useConsentStore((state) => state.hasHydrated);
  const { isSaving, saveConsent } = useConsentActions();

  const [analyticsEnabled, setAnalyticsEnabled] = useState(
    consent?.analytics ?? false,
  );
  const [personalizedAdsEnabled, setPersonalizedAdsEnabled] = useState(
    consent?.adsPersonalization ?? false,
  );

  useEffect(() => {
    setAnalyticsEnabled(consent?.analytics ?? false);
    setPersonalizedAdsEnabled(consent?.adsPersonalization ?? false);
  }, [consent?.adsPersonalization, consent?.analytics]);

  const handleSave = async (
    analytics: boolean,
    adsPersonalization: boolean,
  ) => {
    const result = await saveConsent({
      analytics,
      adsPersonalization,
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

  if (!consentHydrated) {
    return null;
  }

  return (
    <View className="flex-1 bg-surface-tertiary">
      <ScreenHeader title="Privacy" />
      <ConsentPreferencesForm
        analyticsEnabled={analyticsEnabled}
        personalizedAdsEnabled={personalizedAdsEnabled}
        onAnalyticsChange={setAnalyticsEnabled}
        onPersonalizedAdsChange={setPersonalizedAdsEnabled}
        primaryLabel="Save preferences"
        onPrimaryPress={() =>
          void handleSave(analyticsEnabled, personalizedAdsEnabled)
        }
        secondaryLabel="Use privacy-first settings"
        onSecondaryPress={() => void handleSave(false, false)}
        loading={isSaving}
        testIDPrefix="privacy-settings"
        withSafeArea={false}
      />
    </View>
  );
}
