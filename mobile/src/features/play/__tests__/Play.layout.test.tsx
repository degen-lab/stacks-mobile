import { fireEvent, render } from "@/lib/tests";
import type { LeaderboardUser } from "@/features/leaderboard/types";
import type { UserProfile } from "@/api/user/types";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import React from "react";
import { PlayLayout } from "../container/Play.layout";

jest.mock("@/features/leaderboard/components/leaderboard-list", () => ({
  LeaderboardList: () => null,
}));

jest.mock("@/features/leaderboard/components/podium", () => ({
  Podium: () => null,
}));

jest.mock("@/features/play/components", () => {
  const React = jest.requireActual("react");
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    GameCard: ({ onPressPlay }: { onPressPlay?: () => void }) => (
      <Pressable onPress={onPressPlay}>
        <Text>Game Card</Text>
      </Pressable>
    ),
    MenuButton: ({
      label,
      onPress,
    }: {
      label: string;
      onPress?: () => void;
    }) => (
      <Pressable onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
    ChallengeCard: () => null,
    PowerUpsModal: (() => {
      const Component = React.forwardRef(
        (_props: Record<string, any>, _ref: React.Ref<BottomSheetModal>) => {
          return null;
        },
      );
      Component.displayName = "PowerUpsModal";
      return Component;
    })(),
    SkinSelectorModal: (() => {
      const Component = React.forwardRef(
        (_props: Record<string, any>, _ref: React.Ref<BottomSheetModal>) => {
          return null;
        },
      );
      Component.displayName = "SkinSelectorModal";
      return Component;
    })(),
  };
});

describe("PlayLayout", () => {
  const baseProps = {
    dailyStreakDescription: "Daily challenge",
    userProfile: {
      lastStreakCompletionDate: "2024-01-01T00:00:00Z",
      streak: 3,
      points: 42,
    } as Pick<UserProfile, "lastStreakCompletionDate" | "streak" | "points">,
    submittedHighscore: 10,
    weeklyContestSubmissions: 4,
    podiumUsers: [] as LeaderboardUser[],
    leaderboardUsers: [] as LeaderboardUser[],
    currentUserRank: 2,
    skinSelectorModalRef: {
      current: null,
    } as React.RefObject<BottomSheetModal | null>,
    powerUpsModalRef: {
      current: null,
    } as React.RefObject<BottomSheetModal | null>,
  };

  it("triggers game navigation", () => {
    const onNavigateToStacksBridge = jest.fn();
    const onOpenSkinSelector = jest.fn();
    const onOpenPowerUps = jest.fn();

    const { getByText } = render(
      <PlayLayout
        {...baseProps}
        onNavigateToStacksBridge={onNavigateToStacksBridge}
        onOpenSkinSelector={onOpenSkinSelector}
        onOpenPowerUps={onOpenPowerUps}
      />,
    );

    fireEvent.press(getByText("Game Card"));
    expect(onNavigateToStacksBridge).toHaveBeenCalledTimes(1);
    expect(onOpenPowerUps).not.toHaveBeenCalled();
    expect(onOpenSkinSelector).not.toHaveBeenCalled();
  });

  it("opens the power-ups modal", () => {
    const onNavigateToStacksBridge = jest.fn();
    const onOpenSkinSelector = jest.fn();
    const onOpenPowerUps = jest.fn();

    const { getByText } = render(
      <PlayLayout
        {...baseProps}
        onNavigateToStacksBridge={onNavigateToStacksBridge}
        onOpenSkinSelector={onOpenSkinSelector}
        onOpenPowerUps={onOpenPowerUps}
      />,
    );

    fireEvent.press(getByText("Power-ups"));
    expect(onOpenPowerUps).toHaveBeenCalledTimes(1);
    expect(onNavigateToStacksBridge).not.toHaveBeenCalled();
    expect(onOpenSkinSelector).not.toHaveBeenCalled();
  });

  it("opens the skins modal", () => {
    const onNavigateToStacksBridge = jest.fn();
    const onOpenSkinSelector = jest.fn();
    const onOpenPowerUps = jest.fn();

    const { getByText } = render(
      <PlayLayout
        {...baseProps}
        onNavigateToStacksBridge={onNavigateToStacksBridge}
        onOpenSkinSelector={onOpenSkinSelector}
        onOpenPowerUps={onOpenPowerUps}
      />,
    );

    fireEvent.press(getByText("Skins"));
    expect(onOpenSkinSelector).toHaveBeenCalledTimes(1);
    expect(onNavigateToStacksBridge).not.toHaveBeenCalled();
    expect(onOpenPowerUps).not.toHaveBeenCalled();
  });
});
