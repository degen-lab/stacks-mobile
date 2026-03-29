import React from "react";

import { render, waitFor } from "@/lib/tests";

import { ConsentController } from "../consent-controller";

const mockSetEnabled = jest.fn();
const mockSetUserContext = jest.fn();
const mockClearUserContext = jest.fn();
const mockResetConsentStore = jest.fn();
const mockSyncPendingConsent = jest.fn();

let mockAuthState: any;
let mockConsentState: any;

jest.mock("expo-router", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/lib/analytics", () => ({
  setEnabled: (...args: unknown[]) => mockSetEnabled(...args),
  setUserContext: (...args: unknown[]) => mockSetUserContext(...args),
  clearUserContext: (...args: unknown[]) => mockClearUserContext(...args),
  trackEvent: jest.fn(),
  trackScreen: jest.fn(),
}));

jest.mock("@/lib/env", () => ({
  Env: { APP_ENV: "development", NETWORK: "mainnet" },
}));

jest.mock("@/lib/consent/use-consent-actions", () => ({
  useConsentActions: () => ({ syncPendingConsent: mockSyncPendingConsent }),
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => mockAuthState,
}));

jest.mock("@/lib/store/consent", () => ({
  useConsentStore: () => mockConsentState,
  resetConsentStore: (...args: unknown[]) => mockResetConsentStore(...args),
}));

const consentedUser = {
  backendUserData: {
    id: 42,
    consent: {
      analytics: true,
      adsPersonalization: false,
      version: "v5",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
  },
  hasHydrated: true,
  hasBackup: true,
  isAuthenticated: true,
};

describe("ConsentController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = consentedUser;
    mockConsentState = { hasHydrated: true, pendingSync: null };
  });

  it("enables analytics and sets user identity for a consented user", async () => {
    render(<ConsentController />);

    await waitFor(() => {
      expect(mockSetEnabled).toHaveBeenCalledWith(true);
      expect(mockSetUserContext).toHaveBeenCalledWith({
        userId: "42",
        app_env: "development",
        network: "mainnet",
        auth_method: "google",
        has_backup: true,
      });
    });
    expect(mockClearUserContext).not.toHaveBeenCalled();
  });

  it("disables analytics and clears identity on sign out", async () => {
    const { rerender } = render(<ConsentController />);
    await waitFor(() => expect(mockSetEnabled).toHaveBeenCalledWith(true));
    jest.clearAllMocks();

    mockAuthState = {
      backendUserData: null,
      hasHydrated: true,
      hasBackup: false,
      isAuthenticated: false,
    };
    rerender(<ConsentController />);

    await waitFor(() => {
      expect(mockSetEnabled).toHaveBeenCalledWith(false);
      expect(mockClearUserContext).toHaveBeenCalledTimes(1);
      expect(mockResetConsentStore).toHaveBeenCalledTimes(1);
    });
  });
});
