import React from "react";

import { fireEvent, render, screen } from "@/lib/tests/test-utils";
import { CalculatorLayout } from "../Calculator.layout";

jest.mock("@/components/ui/slider-value", () => ({
  ValueSlider: () => null,
}));

jest.mock("@/features/dual-stacking/components/layout/section-header", () => {
  const { View } = jest.requireActual("react-native");

  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

describe("CalculatorLayout", () => {
  it("updates the displayed sBTC input when switching to USD while the field is focused", () => {
    render(
      <CalculatorLayout
        sbtcWalletInput="1"
        stxInput="1000"
        handleSbtcWalletChange={jest.fn()}
        handleStxChange={jest.fn()}
        stxAmount={1000}
        handleSliderChange={jest.fn()}
        isLoadingBalances={false}
        isLoadingResults={false}
        isRewardsError={false}
        rewardsSbtc={0.1}
        rewardsUsd={100}
        sliderMax={10_000}
        totalApr={12}
        btcUsdPrice={100_000}
        stxUsdPrice={1}
      />,
    );

    const sbtcInput = screen.getByDisplayValue("1");

    fireEvent(sbtcInput, "focus");
    fireEvent.press(screen.getAllByText("USD")[0]);

    expect(screen.getByDisplayValue("100,000.00")).toBeTruthy();
  });
});
