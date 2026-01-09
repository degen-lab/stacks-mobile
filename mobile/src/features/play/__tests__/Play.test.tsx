import type { RefObject } from "react";
import { render } from "@/lib/tests";
import { __mockRouter } from "expo-router";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import PlayScreen from "../container/Play";

const mockLayoutProps: { current: Record<string, any> | null } = {
  current: null,
};

const mockUseDailyStreak = jest.fn();
const mockUseUserProfile = jest.fn();
const mockUseTournamentLeaderboard = jest.fn();
const mockUseCurrentTournamentSubmissions = jest.fn();
const mockBuildLeaderboardUsers = jest.fn();
const mockBuildPodiumUsers = jest.fn();

jest.mock("@/api/game/session/use-daily-streak", () => ({
  useDailyStreak: () => mockUseDailyStreak(),
}));

jest.mock("@/api/user", () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

jest.mock("@/api/tournament", () => ({
  useTournamentLeaderboard: () => mockUseTournamentLeaderboard(),
  useCurrentTournamentSubmissions: () => mockUseCurrentTournamentSubmissions(),
}));

jest.mock("@/features/leaderboard/utils", () => ({
  buildLeaderboardUsers: (...args: any[]) => mockBuildLeaderboardUsers(...args),
  buildPodiumUsers: (...args: any[]) => mockBuildPodiumUsers(...args),
}));

jest.mock("../container/Play.layout", () => ({
  PlayLayout: (props: Record<string, any>) => {
    mockLayoutProps.current = props;
    return null;
  },
}));

describe("PlayScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLayoutProps.current = null;
    mockUseDailyStreak.mockReturnValue({
      data: { description: "Test streak" },
    });
    mockUseUserProfile.mockReturnValue({ data: { points: 10 } });
    mockUseTournamentLeaderboard.mockReturnValue({
      data: {
        userSubmission: { score: 8 },
        userPosition: 5,
      },
    });
    mockUseCurrentTournamentSubmissions.mockReturnValue({
      data: {
        weeklyContestSubmissionsForCurrentTournament: [1, 2, 3],
      },
    });
    mockBuildLeaderboardUsers.mockReturnValue([{ id: "leader" }]);
    mockBuildPodiumUsers.mockReturnValue([{ id: "podium" }]);
  });
  it("navigates to the game and opens modals", () => {
    render(<PlayScreen />);

    const skinRef = mockLayoutProps.current
      ?.skinSelectorModalRef as RefObject<BottomSheetModal | null>;
    const powerUpsRef = mockLayoutProps.current
      ?.powerUpsModalRef as RefObject<BottomSheetModal | null>;

    const presentSkin = jest.fn();
    const presentPowerUps = jest.fn();

    skinRef.current = { present: presentSkin } as any;
    powerUpsRef.current = { present: presentPowerUps } as any;

    mockLayoutProps.current?.onNavigateToStacksBridge();
    mockLayoutProps.current?.onOpenSkinSelector();
    mockLayoutProps.current?.onOpenPowerUps();

    expect(__mockRouter.push).toHaveBeenCalledWith("/stacks-bridge");
    expect(presentSkin).toHaveBeenCalled();
    expect(presentPowerUps).toHaveBeenCalled();
  });

  it("derives scores and submissions for the layout", () => {
    render(<PlayScreen />);

    expect(mockLayoutProps.current?.submittedHighscore).toBe(8);
    expect(mockLayoutProps.current?.weeklyContestSubmissions).toBe(3);
    expect(mockLayoutProps.current?.currentUserRank).toBe(5);
    expect(mockLayoutProps.current?.dailyStreakDescription).toBe("Test streak");
  });

  it("defaults empty daily streak description", () => {
    mockUseDailyStreak.mockReturnValue({ data: undefined });

    render(<PlayScreen />);

    expect(mockLayoutProps.current?.dailyStreakDescription).toBe("");
  });
  it("builds leaderboard users from tournament data", () => {
    render(<PlayScreen />);

    expect(mockBuildPodiumUsers).toHaveBeenCalledWith(
      mockUseTournamentLeaderboard.mock.results[0]?.value?.data,
    );
    expect(mockBuildLeaderboardUsers).toHaveBeenCalledWith(
      mockUseTournamentLeaderboard.mock.results[0]?.value?.data,
    );
    expect(mockLayoutProps.current?.podiumUsers).toEqual([{ id: "podium" }]);
    expect(mockLayoutProps.current?.leaderboardUsers).toEqual([
      { id: "leader" },
    ]);
  });
});
