import React from "react";

import { render, screen } from "@/lib/tests";

import EarnLayout from "../Earn.layout";

jest.mock("@/features/earn/components/portfolio/overview-card", () => ({
  EarnOverviewCard: () => {
    const { Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return (
      <View testID="earn-overview-card">
        <Text>Portfolio</Text>
      </View>
    );
  },
}));

jest.mock(
  "@/features/earn/components/next-step/earn-next-steps-section",
  () => ({
    EarnNextStepsSection: () => {
      const { Text, View } =
        jest.requireActual<typeof import("react-native")>("react-native");
      return (
        <View testID="earn-next-steps-section">
          <Text>Next steps</Text>
        </View>
      );
    },
  }),
);

const assets = [
  {
    id: "btc" as const,
    symbol: "BTC",
    name: "Bitcoin",
    icon: null,
    amount: 0.5,
    balanceBaseUnits: "50000000",
    decimals: 8,
    displayDecimals: 8,
    unitPriceUsd: 50_000,
    valueUsd: 25_000,
  },
  {
    id: "stx" as const,
    symbol: "STX",
    name: "Stacks",
    icon: null,
    amount: 1_250,
    balanceBaseUnits: "1250000000",
    decimals: 6,
    displayDecimals: 2,
    unitPriceUsd: 2,
    valueUsd: 2_500,
  },
  {
    id: "sbtc" as const,
    symbol: "sBTC",
    name: "sBTC",
    icon: null,
    amount: 0.25,
    balanceBaseUnits: "25000000",
    decimals: 8,
    displayDecimals: 8,
    unitPriceUsd: 50_000,
    valueUsd: 12_500,
  },
];

describe("EarnLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the portfolio card, what's next, and the your assets section", () => {
    render(
      <EarnLayout
        assets={assets}
        portfolioTotalUsd={40_000}
        rewardsTotalUsd={500}
        rewardRows={[]}
        nextStepCards={[]}
        isLoading={false}
        isRewardsLoading={false}
        isNextStepsLoading={false}
        isBalanceVisible={true}
        onPressRewardRow={jest.fn()}
        onPressNextStepCard={jest.fn()}
        onPressAsset={jest.fn()}
      />,
    );

    expect(screen.getByTestId("earn-overview-card")).toBeTruthy();
    expect(screen.getByTestId("earn-next-steps-section")).toBeTruthy();
    expect(screen.getByText("Your Assets")).toBeTruthy();
    expect(screen.getByTestId("earn-assets-list")).toBeTruthy();
    expect(screen.queryByTestId("earn-content-toggle-defi")).toBeNull();
    expect(screen.queryByTestId("earn-content-toggle-tokens")).toBeNull();
  });
});
