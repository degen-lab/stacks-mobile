import React from "react";

import { render, waitFor } from "@/lib/tests";
import { CURRENT_CONSENT_VERSION } from "@/lib/consent/types";

import { AdsConsentController } from "../ads-consent-controller";

const mockSyncConsentInfo = jest.fn(() => Promise.resolve({}));
const mockSetMobileAdsInitialized = jest.fn();
const mockInitializeAds = jest.fn();
const mockSyncAdsPersonalizationMirror = jest.fn();

let mockAdsConsentState: any;
let mockAuthState: any;
let mockConsentState: any;

jest.mock("@/lib/ads/initialize-ads", () => ({
  initializeAds: (...args: unknown[]) => mockInitializeAds(...args),
}));

jest.mock("@/lib/store/ads-consent", () => ({
  useAdsConsentStore: (selector: (state: any) => unknown) =>
    selector(mockAdsConsentState),
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => mockAuthState,
}));

jest.mock("@/lib/store/consent", () => ({
  useConsentStore: (selector: (state: any) => unknown) =>
    selector(mockConsentState),
}));

jest.mock("@/lib/consent/use-consent-actions", () => ({
  useConsentActions: () => ({
    syncAdsPersonalizationMirror: mockSyncAdsPersonalizationMirror,
  }),
}));

describe("AdsConsentController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitializeAds.mockResolvedValue(true);
    mockAdsConsentState = {
      syncConsentInfo: mockSyncConsentInfo,
      hasResolved: false,
      canRequestAds: false,
      adsPersonalization: null,
      isMobileAdsInitialized: false,
      setMobileAdsInitialized: mockSetMobileAdsInitialized,
    };
    mockAuthState = {
      backendUserData: null,
      isAuthenticated: false,
    };
    mockConsentState = {
      pendingSync: null,
    };
  });

  it("starts the UMP sync flow on mount", async () => {
    render(<AdsConsentController />);

    await waitFor(() => {
      expect(mockSyncConsentInfo).toHaveBeenCalledWith({
        loadAndShowFormIfRequired: true,
      });
    });
  });

  it("initializes mobile ads and mirrors UMP choices when available", async () => {
    mockAdsConsentState = {
      ...mockAdsConsentState,
      hasResolved: true,
      canRequestAds: true,
      adsPersonalization: true,
    };
    mockAuthState = {
      backendUserData: {
        id: 42,
        consent: {
          analytics: true,
          adsPersonalization: false,
          version: CURRENT_CONSENT_VERSION,
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      },
      isAuthenticated: true,
    };

    render(<AdsConsentController />);

    await waitFor(() => {
      expect(mockInitializeAds).toHaveBeenCalledTimes(1);
      expect(mockSetMobileAdsInitialized).toHaveBeenCalledWith(true);
      expect(mockSyncAdsPersonalizationMirror).toHaveBeenCalledWith(true);
    });
  });
});
