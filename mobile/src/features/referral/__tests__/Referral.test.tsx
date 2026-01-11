import React from "react";
import type { ShareAction } from "react-native";
import { Linking, Share } from "react-native";
import type { AxiosError } from "axios";
import type { QueryObserverSuccessResult } from "@tanstack/query-core";

import { fireEvent, render, screen, waitFor } from "@/lib/tests";

import ReferralContainer from "../container/Referral";

import { useActiveReferrals } from "@/api/referrals/use-active-referrals";
import type { ActiveReferralsData } from "@/api/referrals/types";
import {
  buildShareMessage,
  socialShareTargets,
} from "@/features/referral/utils/social-share";
import { useI18nSettings } from "@/hooks/use-i18n-settings";
import { formatFriendlyDate, isToday } from "@/lib/format/date";
import { useAuth } from "@/lib/store/auth";
import type { UserData } from "@/api/auth";

jest.mock("@/api/referrals/use-active-referrals", () => ({
  useActiveReferrals: jest.fn(),
}));

jest.mock("@/features/referral/utils/social-share", () => ({
  buildShareMessage: jest.fn(),
  socialShareTargets: jest.fn(),
}));

jest.mock("@/hooks/use-i18n-settings", () => ({
  useI18nSettings: jest.fn(),
}));

jest.mock("@/lib/format/date", () => ({
  formatFriendlyDate: jest.fn(),
  isToday: jest.fn(),
}));

jest.mock("@/lib/store/auth", () => ({
  useAuth: jest.fn(),
}));

const referralData: ActiveReferralsData = {
  count: 2,
  referrals: [
    {
      id: 1,
      nickName: "PlayerOne",
      referralCode: "CODE0001",
      createdAt: "2024-01-01",
      lastStreakCompletionDate: "2024-01-02",
      points: 10,
      streak: 0,
    },
    {
      id: 2,
      nickName: "PlayerTwo",
      referralCode: "CODE0002",
      createdAt: "2024-01-03",
      lastStreakCompletionDate: "2024-01-01",
      points: 5,
      streak: 0,
    },
  ],
};

describe("ReferralContainer", () => {
  const createActiveReferralsResult = (
    data: ActiveReferralsData,
  ): QueryObserverSuccessResult<ActiveReferralsData, AxiosError> => ({
    data,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isLoading: false,
    isPending: false,
    isLoadingError: false,
    isInitialLoading: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    isEnabled: true,
    refetch: async () => createActiveReferralsResult(data),
    status: "success",
    fetchStatus: "idle",
    promise: Promise.resolve(data),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const mockBackendUserData: UserData = {
      id: 1,
      nickname: "TestUser",
      referralCode: "ABC12345",
      streak: 0,
      points: 0,
    };

    jest.mocked(useAuth).mockReturnValue({
      authMethod: "google",
      accessToken: "mock-token",
      backendToken: "mock-backend-token",
      isAuthenticated: true,
      isAuthenticating: false,
      hasHydrated: true,
      hasBackup: false,
      userData: null,
      backendUserData: mockBackendUserData,
      referralUsed: false,
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
      hydrate: jest.fn(),
      completeGoogleAuth: jest.fn(),
      setBackendSession: jest.fn(),
    });
    jest
      .mocked(useActiveReferrals)
      .mockReturnValue(createActiveReferralsResult(referralData));
    jest.mocked(useI18nSettings).mockReturnValue({
      locale: "en-US",
      timeZone: "UTC",
    });
    jest.mocked(formatFriendlyDate).mockReturnValue("Jan 1, 2024");
    jest.mocked(isToday).mockImplementation((value) => value === "2024-01-02");
    jest.mocked(buildShareMessage).mockReturnValue("share-message");
    jest.mocked(socialShareTargets).mockReturnValue({
      x: "https://x.com/intent/tweet?text=share-message",
      telegram: "https://t.me/share/url?url=landing&text=share-message",
      whatsapp: "https://wa.me/?text=share-message",
    });
  });

  it("computes stats and invited players for the layout", () => {
    render(React.createElement(ReferralContainer));

    expect(
      screen.getByTestId("referral-stat-total-invites-label"),
    ).toHaveTextContent("Total Invites");
    expect(
      screen.getByTestId("referral-stat-points-earned-label"),
    ).toHaveTextContent("Points Earned");
    expect(screen.getByTestId("referral-user-1-nickname")).toHaveTextContent(
      "PlayerOne",
    );
    expect(screen.getByTestId("referral-user-1-joined")).toHaveTextContent(
      "Joined Jan 1, 2024",
    );
    expect(screen.getByTestId("referral-user-1-points")).toHaveTextContent(
      "+10 points",
    );
  });

  it("opens the social share URL when supported", async () => {
    render(React.createElement(ReferralContainer));

    const canOpenSpy = jest
      .spyOn(Linking, "canOpenURL")
      .mockResolvedValue(true);
    const openSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const shareResult: ShareAction = { action: Share.sharedAction };
    const shareSpy = jest.spyOn(Share, "share").mockResolvedValue(shareResult);

    fireEvent.press(screen.getByLabelText("Share on X"));

    await waitFor(() => {
      expect(buildShareMessage).toHaveBeenCalledWith("ABC12345");
      expect(openSpy).toHaveBeenCalledWith(
        "https://x.com/intent/tweet?text=share-message",
      );
      expect(canOpenSpy).toHaveBeenCalledWith(
        "https://x.com/intent/tweet?text=share-message",
      );
    });
    expect(shareSpy).not.toHaveBeenCalled();
  });

  it("falls back to native share when URL is unsupported", async () => {
    render(React.createElement(ReferralContainer));

    const canOpenSpy = jest
      .spyOn(Linking, "canOpenURL")
      .mockResolvedValue(false);
    const openSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    const shareResult: ShareAction = { action: Share.sharedAction };
    const shareSpy = jest.spyOn(Share, "share").mockResolvedValue(shareResult);

    fireEvent.press(screen.getByLabelText("Share on Telegram"));

    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith({ message: "share-message" });
      expect(canOpenSpy).toHaveBeenCalledWith(
        "https://t.me/share/url?url=landing&text=share-message",
      );
    });
    expect(openSpy).not.toHaveBeenCalled();
  });
});
