import React, { type ReactNode } from "react";

import { fireEvent, render, screen } from "@/lib/tests";

import { EarnOverviewCard } from "../portfolio/overview-card";

jest.mock("victory-native", () => {
  return {
    PolarChart: ({ children }: { children: ReactNode }) => <>{children}</>,
    Pie: {
      Chart: ({ children }: { children: (() => ReactNode) | ReactNode }) => (
        <>{typeof children === "function" ? children() : children}</>
      ),
      Slice: () => null,
      SliceAngularInset: () => null,
    },
  };
});

const mockAssets = [
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
    amount: 500,
    balanceBaseUnits: "500000000",
    decimals: 6,
    displayDecimals: 2,
    unitPriceUsd: 2,
    valueUsd: 1_000,
  },
  {
    id: "sbtc" as const,
    symbol: "sBTC",
    name: "sBTC",
    icon: null,
    amount: 0.15,
    balanceBaseUnits: "15000000",
    decimals: 8,
    displayDecimals: 8,
    unitPriceUsd: 50_000,
    valueUsd: 7_500,
  },
];

const mockRewardRows = [
  {
    id: "bridge-game" as const,
    label: "Stacks Bridge",
    statusLabel: "No submissions",
    statusTone: "inactive" as const,
    value: 0,
    valueToken: "stx" as const,
  },
  {
    id: "stacking" as const,
    label: "STX Stacking",
    statusLabel: "Earning",
    statusTone: "active" as const,
    value: 0.01,
    valueToken: "btc" as const,
  },
  {
    id: "dual-stacking" as const,
    label: "Dual Stacking",
    statusLabel: "Earning",
    statusTone: "active" as const,
    value: 0.02,
    valueToken: "btc" as const,
  },
];

describe("EarnOverviewCard", () => {
  it("switches to rewards and calls the row handler", () => {
    const onPressRewardRow = jest.fn();

    render(
      <EarnOverviewCard
        assets={mockAssets}
        portfolioTotalUsd={33_500}
        rewardsTotalUsd={180}
        rewardRows={mockRewardRows}
        isLoading={false}
        isRewardsLoading={false}
        isBalanceVisible={true}
        onPressRewardRow={onPressRewardRow}
      />,
    );

    fireEvent.press(screen.getByTestId("earn-overview-toggle-rewards"));

    expect(screen.getByText("Dual Stacking")).toBeTruthy();
    expect(screen.getByText("STX Stacking")).toBeTruthy();
    expect(screen.getByText("Stacks Bridge")).toBeTruthy();

    fireEvent.press(screen.getByTestId("earn-rewards-row-dual-stacking"));

    expect(onPressRewardRow).toHaveBeenCalledWith(
      expect.objectContaining({ id: "dual-stacking" }),
    );
  });

  it("shows reward row statuses and zero values without an empty state", () => {
    render(
      <EarnOverviewCard
        assets={mockAssets}
        portfolioTotalUsd={33_500}
        rewardsTotalUsd={0}
        rewardRows={[
          {
            id: "bridge-game",
            label: "Stacks Bridge",
            statusLabel: "Earning",
            statusTone: "active",
            value: 0,
            valueToken: "stx",
          },
          {
            id: "stacking",
            label: "STX Stacking",
            statusLabel: "Not active",
            statusTone: "inactive",
            value: 0,
            valueToken: "btc",
          },
          {
            id: "dual-stacking",
            label: "Dual Stacking",
            statusLabel: "Not active",
            statusTone: "inactive",
            value: 0,
            valueToken: "btc",
          },
        ]}
        isLoading={false}
        isRewardsLoading={false}
        isBalanceVisible={true}
        onPressRewardRow={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("earn-overview-toggle-rewards"));

    expect(screen.getAllByText("Not active")).toHaveLength(2);
    expect(screen.getByText("Earning")).toBeTruthy();
    expect(screen.getByText("0 STX")).toBeTruthy();
  });
});
