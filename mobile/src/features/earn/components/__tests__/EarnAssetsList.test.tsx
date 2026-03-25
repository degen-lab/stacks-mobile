import React from "react";

import { fireEvent, render, screen } from "@/lib/tests";

import { TokensList } from "../tokens/tokens-list";

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
    change24hPercent: 1.8,
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
    change24hPercent: -3.2,
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
    change24hPercent: 1.8,
  },
];

describe("EarnAssetsList", () => {
  it("renders ordered asset rows", () => {
    render(
      <TokensList
        assets={mockAssets}
        isLoading={false}
        isBalanceVisible={true}
      />,
    );

    expect(screen.getByTestId("earn-asset-card-btc")).toBeTruthy();
    expect(screen.getByTestId("earn-asset-card-stx")).toBeTruthy();
    expect(screen.getByTestId("earn-asset-card-sbtc")).toBeTruthy();
    expect(screen.getByTestId("earn-asset-owned-btc")).toBeTruthy();
    expect(screen.getByText("Bitcoin")).toBeTruthy();
  });

  it("masks balances and values", () => {
    render(
      <TokensList
        assets={mockAssets}
        isLoading={false}
        isBalanceVisible={false}
      />,
    );

    expect(
      String(screen.getByTestId("earn-asset-owned-btc").props.children),
    ).toContain("*");
    expect(
      String(screen.getByTestId("earn-asset-value-btc").props.children),
    ).toContain("*");
  });

  it("shows the loading skeleton", () => {
    render(
      <TokensList assets={mockAssets} isLoading isBalanceVisible={true} />,
    );

    expect(screen.getByTestId("tokens-list-skeleton")).toBeTruthy();
  });

  it("opens an asset when a row is pressed", () => {
    const onPressAsset = jest.fn();

    render(
      <TokensList
        assets={mockAssets}
        isLoading={false}
        isBalanceVisible={true}
        onPressAsset={onPressAsset}
      />,
    );

    fireEvent.press(screen.getByLabelText("Open Bitcoin details"));

    expect(onPressAsset).toHaveBeenCalledWith(mockAssets[0]);
  });
});
