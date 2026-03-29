export const CURRENT_CONSENT_VERSION = "v1";

export type ConsentDto = {
  analytics: boolean | null;
  adsPersonalization: boolean | null;
  version: string | null;
  updatedAt: string | null;
};

export type ConsentDecision = {
  analytics: boolean;
  adsPersonalization: boolean;
  version: string;
};

export type PendingConsentSync = {
  userId: number;
  payload: ConsentDecision;
  localConsent: ConsentDto;
};

export function createLocalConsent(
  decision: ConsentDecision,
  updatedAt = new Date().toISOString(),
): ConsentDto {
  return { ...decision, updatedAt };
}

export function isConsentCurrent(consent: ConsentDto | null | undefined) {
  if (!consent) return false;
  return (
    consent.version === CURRENT_CONSENT_VERSION &&
    consent.analytics !== null &&
    consent.adsPersonalization !== null
  );
}

export function needsConsentGate(consent: ConsentDto | null | undefined) {
  return !isConsentCurrent(consent);
}
