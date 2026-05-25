import { create } from "zustand";
import {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentPrivacyOptionsRequirementStatus,
  AdsConsentStatus,
  type AdsConsentInfo,
  type AdsConsentInfoOptions,
  type AdsConsentUserChoices,
} from "react-native-google-mobile-ads";

import { getTestDeviceIds } from "@/lib/ads/initialize-ads";

export type AdsConsentSnapshot = {
  status: AdsConsentStatus;
  canRequestAds: boolean;
  privacyOptionsRequirementStatus: AdsConsentPrivacyOptionsRequirementStatus;
  isConsentFormAvailable: boolean;
  adsPersonalization: boolean | null;
};

type SyncAdsConsentOptions = {
  loadAndShowFormIfRequired?: boolean;
};

type AdsConsentStoreState = AdsConsentSnapshot & {
  isLoading: boolean;
  hasResolved: boolean;
  error: string | null;
  isMobileAdsInitialized: boolean;
  setMobileAdsInitialized: (initialized: boolean) => void;
  syncConsentInfo: (
    options?: SyncAdsConsentOptions,
  ) => Promise<AdsConsentSnapshot>;
  showPrivacyOptionsForm: () => Promise<AdsConsentSnapshot>;
};

const DEFAULT_SNAPSHOT: AdsConsentSnapshot = {
  status: AdsConsentStatus.UNKNOWN,
  canRequestAds: false,
  privacyOptionsRequirementStatus:
    AdsConsentPrivacyOptionsRequirementStatus.UNKNOWN,
  isConsentFormAvailable: false,
  adsPersonalization: null,
};

function getAdsConsentInfoOptions(): AdsConsentInfoOptions {
  return {
    // Keep UMP in under-age mode so consent does not enable personalized ads.
    tagForUnderAgeOfConsent: true,
    testDeviceIdentifiers: __DEV__ ? getTestDeviceIds() : [],
    debugGeography: AdsConsentDebugGeography.DISABLED,
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Unable to load ad consent information.";
}

async function getAdsPersonalization(
  consentInfo: AdsConsentInfo,
): Promise<boolean | null> {
  try {
    const userChoices: AdsConsentUserChoices =
      await AdsConsent.getUserChoices();
    return userChoices.selectPersonalisedAds === true;
  } catch {
    return consentInfo.status === AdsConsentStatus.NOT_REQUIRED ? false : null;
  }
}

async function createSnapshot(
  consentInfo: AdsConsentInfo,
): Promise<AdsConsentSnapshot> {
  return {
    status: consentInfo.status,
    canRequestAds: consentInfo.canRequestAds,
    privacyOptionsRequirementStatus:
      consentInfo.privacyOptionsRequirementStatus,
    isConsentFormAvailable: consentInfo.isConsentFormAvailable,
    adsPersonalization: await getAdsPersonalization(consentInfo),
  };
}

async function requestConsentInfo(
  options: SyncAdsConsentOptions = {},
): Promise<AdsConsentInfo> {
  const consentInfo = await AdsConsent.requestInfoUpdate(
    getAdsConsentInfoOptions(),
  );

  if (options.loadAndShowFormIfRequired) {
    await AdsConsent.loadAndShowConsentFormIfRequired();
    return await AdsConsent.getConsentInfo();
  }

  return consentInfo;
}

function setResolvedState(
  set: (partial: Partial<AdsConsentStoreState>) => void,
  snapshot: AdsConsentSnapshot,
  error: string | null,
) {
  set({
    ...snapshot,
    isLoading: false,
    hasResolved: true,
    error,
  });
}

export const useAdsConsentStore = create<AdsConsentStoreState>((set, get) => ({
  ...DEFAULT_SNAPSHOT,
  isLoading: false,
  hasResolved: false,
  error: null,
  isMobileAdsInitialized: false,

  setMobileAdsInitialized: (initialized) => {
    set({ isMobileAdsInitialized: initialized });
  },

  syncConsentInfo: async (options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const consentInfo = await requestConsentInfo(options);
      const snapshot = await createSnapshot(consentInfo);
      setResolvedState(set, snapshot, null);
      return snapshot;
    } catch (error) {
      const message = getErrorMessage(error);

      try {
        const fallbackConsentInfo = await AdsConsent.getConsentInfo();
        const snapshot = await createSnapshot(fallbackConsentInfo);
        setResolvedState(set, snapshot, message);
        return snapshot;
      } catch {
        setResolvedState(set, DEFAULT_SNAPSHOT, message);
        return DEFAULT_SNAPSHOT;
      }
    }
  },

  showPrivacyOptionsForm: async () => {
    set({ isLoading: true, error: null });

    try {
      await AdsConsent.showPrivacyOptionsForm();
      return await get().syncConsentInfo();
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },
}));
