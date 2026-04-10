import { act, renderHook } from "@testing-library/react-native";

import { CURRENT_CONSENT_VERSION, type PendingConsentSync } from "../types";
import { useConsentActions } from "../use-consent-actions";

const mockMutateAsync = jest.fn();
const mockSetQueryData = jest.fn();
const mockSetPendingSync = jest.fn();
const mockClearPendingSync = jest.fn();
const mockSetBackendUserData = jest.fn();

let mockPendingSync: PendingConsentSync | null = null;
let mockBackendUserData: any = {
  id: 7,
  nickname: "Tester",
  referralCode: "ABCDEFGH",
  streak: 0,
  points: 0,
  isNewUser: false,
  consent: null,
};

const serverConsent = {
  analytics: true,
  adsPersonalization: false,
  version: CURRENT_CONSENT_VERSION,
  updatedAt: "2024-01-01T00:00:00.000Z",
};

jest.mock("@/api/common/api-provider", () => ({
  queryClient: {
    setQueryData: (...args: unknown[]) => mockSetQueryData(...args),
  },
}));

jest.mock("@/api/user", () => ({
  useUpdateUserConsent: () => ({
    mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    isPending: false,
  }),
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => ({
    backendUserData: mockBackendUserData,
    setBackendUserData: (...args: unknown[]) => mockSetBackendUserData(...args),
  }),
}));

jest.mock("@/lib/store/consent", () => ({
  useConsentStore: Object.assign(
    () => ({
      setPendingSync: (...args: unknown[]) => mockSetPendingSync(...args),
      clearPendingSync: (...args: unknown[]) => mockClearPendingSync(...args),
    }),
    { getState: () => ({ pendingSync: mockPendingSync }) },
  ),
}));

const decision = {
  analytics: true,
  adsPersonalization: false,
  version: CURRENT_CONSENT_VERSION,
};

describe("useConsentActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPendingSync = null;
    mockBackendUserData = {
      id: 7,
      nickname: "Tester",
      referralCode: "ABCDEFGH",
      streak: 0,
      points: 0,
      isNewUser: false,
      consent: null,
    };
    mockMutateAsync.mockResolvedValue({ data: serverConsent });
  });

  describe("saveConsent", () => {
    it("clears pending sync and persists server response on success", async () => {
      const { result } = renderHook(() => useConsentActions());
      let outcome!: Awaited<ReturnType<typeof result.current.saveConsent>>;

      await act(async () => {
        outcome = await result.current.saveConsent(decision);
      });

      expect(outcome.synced).toBe(true);
      expect(outcome.consent).toEqual(serverConsent);
      expect(mockClearPendingSync).toHaveBeenCalledTimes(1);
      expect(mockSetBackendUserData).toHaveBeenCalledWith({
        ...mockBackendUserData,
        consent: serverConsent,
      });
      expect(mockSetQueryData).toHaveBeenCalledWith(
        ["user-profile"],
        expect.any(Function),
      );
      expect(mockSetPendingSync).not.toHaveBeenCalled();
    });

    it("stores pending sync and does not touch backendUserData on failure", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useConsentActions());
      let outcome!: Awaited<ReturnType<typeof result.current.saveConsent>>;

      await act(async () => {
        outcome = await result.current.saveConsent(decision);
      });

      expect(outcome.synced).toBe(false);
      expect(outcome.consent).toMatchObject(decision);
      expect(mockSetPendingSync).toHaveBeenCalledWith(
        7,
        decision,
        expect.objectContaining(decision),
      );
      expect(mockClearPendingSync).not.toHaveBeenCalled();
      expect(mockSetBackendUserData).not.toHaveBeenCalled();
    });
  });

  describe("syncPendingConsent", () => {
    const pendingSync: PendingConsentSync = {
      userId: 7,
      payload: decision,
      localConsent: { ...decision, updatedAt: "2024-01-01T00:00:00.000Z" },
    };

    it("clears pending sync and persists server response on success", async () => {
      mockPendingSync = pendingSync;
      const { result } = renderHook(() => useConsentActions());

      await act(async () => {
        await result.current.syncPendingConsent();
      });

      expect(mockClearPendingSync).toHaveBeenCalledTimes(1);
      expect(mockSetBackendUserData).toHaveBeenCalledWith({
        ...mockBackendUserData,
        consent: serverConsent,
      });
    });

    it("skips sync if pending userId does not match current user", async () => {
      mockPendingSync = { ...pendingSync, userId: 999 };
      const { result } = renderHook(() => useConsentActions());

      await act(async () => {
        await result.current.syncPendingConsent();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockClearPendingSync).not.toHaveBeenCalled();
    });
  });

  describe("syncAdsPersonalizationMirror", () => {
    it("persists a UMP-derived ads preference when analytics consent is current", async () => {
      mockBackendUserData = {
        ...mockBackendUserData,
        consent: {
          analytics: true,
          adsPersonalization: false,
          version: CURRENT_CONSENT_VERSION,
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      };
      mockMutateAsync.mockResolvedValue({
        data: { ...serverConsent, adsPersonalization: true },
      });

      const { result } = renderHook(() => useConsentActions());

      await act(async () => {
        await result.current.syncAdsPersonalizationMirror(true);
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        analytics: true,
        adsPersonalization: true,
        version: CURRENT_CONSENT_VERSION,
      });
    });

    it("skips syncing when analytics consent is not current yet", async () => {
      mockBackendUserData = {
        ...mockBackendUserData,
        consent: {
          analytics: null,
          adsPersonalization: false,
          version: null,
          updatedAt: null,
        },
      };

      const { result } = renderHook(() => useConsentActions());

      await act(async () => {
        await result.current.syncAdsPersonalizationMirror(true);
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
      expect(mockSetPendingSync).not.toHaveBeenCalled();
    });
  });
});
