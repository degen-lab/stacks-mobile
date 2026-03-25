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
    assets: [],
    usdBalance: mockUsdBalance,
    usdBalanceOrNull: mockUsdBalance,
    hasBalance: mockHasBalance,
    stxBalance: 0,
    stxLockedBalance: 0,
    stxAvailableBalance: 0,
    btcBalance: 0,
    sbtcBalance: 0,
    sbtcDefiBalance: 0,
    stxPriceUsd: null,
    btcPriceUsd: null,
    stxChange24hPercent: null,
    btcChange24hPercent: null,
    isLoading: false,
    isBalanceLoading: false,
    isPriceLoading: false,
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
const mockOpenSwap = jest.fn();

jest.mock("@/features/transfer", () => ({
  useTransferSheet: () => ({
    openTransfer: mockOpenTransfer,
  }),
}));

jest.mock("@/features/swaps", () => ({
  useSwapSheet: () => ({
    openSwap: mockOpenSwap,
  }),
}));

jest.mock("@/features/transak/context/transak-context", () => ({
  useTransak: () => ({
    openTransak: jest.fn(),
  }),
}));

jest.mock(
  "@/features/dual-stacking/components/layout/modals/mint-sbtc-sheet",
  () => ({
    MintSbtcSheet: () => null,
  }),
);

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
