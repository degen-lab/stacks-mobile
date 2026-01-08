import { render } from "@/lib/tests";
import { __mockRouter } from "expo-router";

import HomeScreen from "../container/Home";

const mockLayoutProps: { current: Record<string, any> | null } = {
  current: null,
};

let mockStxBalance = 0;
let mockStxPriceUsd: number | undefined = undefined;

const mockModal = {
  ref: { current: null },
  present: jest.fn(),
  dismiss: jest.fn(),
};

jest.mock("@/hooks/use-stx-balance", () => ({
  useStxBalance: () => ({
    balance: mockStxBalance,
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock("@/api/market/use-stacks-price", () => ({
  useStacksPrice: () => ({
    data: mockStxPriceUsd,
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

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLayoutProps.current = null;
    mockStxBalance = 0;
    mockStxPriceUsd = undefined;
  });

  it("passes the computed USD balance to the layout", () => {
    mockStxBalance = 3;
    mockStxPriceUsd = 4;

    render(<HomeScreen />);

    expect(mockLayoutProps.current?.usdBalance).toBe(12);
  });

  it("routes to earn when balance is available", () => {
    mockStxBalance = 1;

    render(<HomeScreen />);
    
    expect(mockLayoutProps.current).not.toBeNull();
    expect(mockLayoutProps.current?.navigateToPortfolio).toBeDefined();
    mockLayoutProps.current?.navigateToPortfolio();

    expect(__mockRouter.push).toHaveBeenCalledWith("/(app)/Earn");
    expect(mockModal.present).not.toHaveBeenCalled();
  });

  it("opens empty wallet modal when balance is zero", () => {
    mockStxBalance = 0;

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
