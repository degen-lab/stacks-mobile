import { render } from "@/lib/tests";
import { __mockRouter } from "expo-router";

import HomeScreen from "../container/Home";

const mockLayoutProps: { current: Record<string, any> | null } = {
  current: null,
};

let mockUsdBalance = 0;
let mockHasBalance = false;

const mockModal = {
  ref: { current: null },
  present: jest.fn(),
  dismiss: jest.fn(),
};

jest.mock("@/hooks/use-portfolio-balance", () => ({
  usePortfolioBalance: () => ({
    usdBalance: mockUsdBalance,
    hasBalance: mockHasBalance,
    stxBalance: 0,
    btcBalance: 0,
    sbtcBalance: 0,
    sbtcDefiBalance: 0,
  }),
}));

jest.mock("@/components/ui", () => ({
  useModal: () => mockModal,
}));

jest.mock("../container/Home.layout", () => ({
  __esModule: true,
  default: (props: Record<string, any>) => {
    // Capture props synchronously
    if (props) {
      mockLayoutProps.current = { ...props };
    }
    return null;
  },
}));

const mockOpenTransfer = jest.fn();

jest.mock("@/features/transfer", () => ({
  useTransferSheet: () => ({
    openTransfer: mockOpenTransfer,
  }),
}));

jest.mock("@/features/transak/context/transak-context", () => ({
  useTransak: () => ({
    openTransak: jest.fn(),
  }),
}));

jest.mock("@/features/earn/hooks/use-earn-actions", () => ({
  useEarnActions: () => ({
    handleBuy: jest.fn(),
    handleSell: jest.fn(),
    handleTransfer: jest.fn(),
    handleSwap: jest.fn(),
    handleBridge: jest.fn(),
  }),
}));

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLayoutProps.current = null;
    mockUsdBalance = 0;
    mockHasBalance = false;
  });

  it("passes the computed USD balance to the layout", () => {
    mockUsdBalance = 75_012;

    render(<HomeScreen />);

    expect(mockLayoutProps.current?.usdBalance).toBe(75_012);
  });

  it("routes to earn when any supported balance is available", () => {
    mockHasBalance = true;

    render(<HomeScreen />);

    expect(mockLayoutProps.current).not.toBeNull();
    expect(mockLayoutProps.current?.navigateToPortfolio).toBeDefined();
    mockLayoutProps.current?.navigateToPortfolio();

    expect(__mockRouter.push).toHaveBeenCalledWith("/(app)/Earn");
    expect(mockModal.present).not.toHaveBeenCalled();
  });

  it("opens empty wallet modal when balance is zero", () => {
    render(<HomeScreen />);
    mockLayoutProps.current?.navigateToPortfolio();

    expect(mockModal.present).toHaveBeenCalledTimes(1);
    expect(__mockRouter.push).not.toHaveBeenCalled();
  });

  it("navigates to play and referral destinations", () => {
    render(<HomeScreen />);

    mockLayoutProps.current?.navigateToPlay();
    mockLayoutProps.current?.navigateToReferral();

    expect(__mockRouter.push).toHaveBeenCalledWith("/(app)/Play");
    expect(__mockRouter.push).toHaveBeenCalledWith("/referral");
  });
});
