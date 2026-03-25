import React from "react";

import { fireEvent, render, screen } from "@/lib/tests";

import { Header } from "../Header";

const mockUsePathname = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUseAuth = jest.fn();
const mockUseUserProfile = jest.fn();
const mockUsePortfolioBalance = jest.fn();
const mockUseBalanceVisibility = jest.fn();

jest.mock("expo-router", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

jest.mock("react-native-safe-area-context", () => {
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock("@/lib/store/auth", () => ({
  useAuth: () => mockUseAuth(),
  signOut: jest.fn(),
}));

jest.mock("@/api/user", () => ({
  useUserProfile: () => mockUseUserProfile(),
}));

jest.mock("@/hooks/use-portfolio-balance", () => ({
  usePortfolioBalance: () => mockUsePortfolioBalance(),
}));

jest.mock("@/lib/store/balance-visibility", () => ({
  useBalanceVisibility: () => mockUseBalanceVisibility(),
}));

jest.mock("@/features/header/components/Avatar", () => ({
  Avatar: () => {
    const { Text } =
      jest.requireActual<typeof import("@/components/ui")>("@/components/ui");
    return <Text>Avatar</Text>;
  },
}));

jest.mock("@/features/header/components/BreadcrumbBar", () => ({
  BreadcrumbBar: () => {
    const { Text } =
      jest.requireActual<typeof import("@/components/ui")>("@/components/ui");
    return <Text>Breadcrumb</Text>;
  },
}));

jest.mock("@/features/header/components/ProfilePopover", () => ({
  ProfilePopover: () => null,
}));

jest.mock("@/features/header/components/PointsPopover", () => ({
  PointsPopover: () => null,
}));

jest.mock("@/features/header/components/StreakPopover", () => ({
  StreakPopover: () => null,
}));

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePathname.mockReturnValue("/Earn");
    mockUseAuth.mockReturnValue({
      userData: {
        user: {
          name: "Nikos",
          email: "nikos@example.com",
          photo: "https://example.com/avatar.png",
        },
      },
    });
    mockUseUserProfile.mockReturnValue({
      data: {
        points: 120,
        streak: 4,
        lastStreakCompletionDate: undefined,
      },
    });
    mockUsePortfolioBalance.mockReturnValue({
      assets: [
        {
          id: "stx",
          symbol: "STX",
          name: "Stacks",
          icon: null,
          amount: 100,
          balanceBaseUnits: "100000000",
          decimals: 6,
          displayDecimals: 2,
          unitPriceUsd: 2,
          valueUsd: 200,
          change24hPercent: 1.5,
        },
      ],
      isLoading: false,
      isBalanceLoading: false,
      isPriceLoading: false,
      usdBalanceOrNull: 12_450,
      stxBalance: 100,
      stxLockedBalance: 0,
      stxAvailableBalance: 100,
      btcBalance: 0.5,
      sbtcBalance: 0.2,
      sbtcDefiBalance: 0,
      stxPriceUsd: 2,
      btcPriceUsd: 50_000,
      stxChange24hPercent: 1.5,
      btcChange24hPercent: 2,
      usdBalance: 12_450,
      hasBalance: true,
    });
    mockUseBalanceVisibility.mockReturnValue({
      isBalanceVisible: true,
      toggleBalanceVisibility: jest.fn(),
      setBalanceVisible: jest.fn(),
    });
  });

  it("keeps the shared avatar and breadcrumb while rendering only the balance trigger on earn", () => {
    render(<Header />);

    expect(screen.getByText("Avatar")).toBeTruthy();
    expect(screen.getByText("Nikos")).toBeTruthy();
    expect(screen.getByText("Breadcrumb")).toBeTruthy();
    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByLabelText("Open balance details")).toBeTruthy();
    expect(screen.getByLabelText("Hide balances")).toBeTruthy();
    expect(screen.queryByLabelText("Open rewards details")).toBeNull();
    expect(screen.queryByText("Rewards")).toBeNull();
  });

  it("opens and closes the balance popover", () => {
    render(<Header />);

    fireEvent.press(screen.getByLabelText("Open balance details"));
    expect(screen.getByText("Account balance")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Close popover backdrop"));
    expect(screen.queryByText("Account balance")).toBeNull();
  });

  it("keeps streak and points on non-earn routes", () => {
    mockUsePathname.mockReturnValue("/Play");

    render(<Header />);

    expect(screen.getByText("Streak")).toBeTruthy();
    expect(screen.getByText("Points")).toBeTruthy();
    expect(screen.queryByText("Balance")).toBeNull();
  });

  it("shows the hidden state in the earn balance trigger", () => {
    mockUseBalanceVisibility.mockReturnValue({
      isBalanceVisible: false,
      toggleBalanceVisibility: jest.fn(),
      setBalanceVisible: jest.fn(),
    });

    render(<Header />);

    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByText("***.**")).toBeTruthy();
    expect(screen.getByLabelText("Show balances")).toBeTruthy();
  });
});
