import React from "react";

import { fireEvent, render, waitFor } from "@/lib/tests";

import { ReferralCodeModal } from "../referral-modal";

jest.mock("expo-asset", () => ({
  Asset: {
    fromModule: () => ({ uri: "asset://gift" }),
  },
}));

describe("ReferralCodeModal", () => {
  it("submits a valid referral code", async () => {
    const onConfirm = jest.fn();
    const onSkip = jest.fn();

    const { getByTestId } = render(
      <ReferralCodeModal onConfirm={onConfirm} onSkip={onSkip} />,
    );

    fireEvent.changeText(getByTestId("referral-code-input"), "A1B2C3D4");
    fireEvent.press(getByTestId("claim-reward-button"));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("A1B2C3D4");
    });
  });

  it("allows skipping the referral code entry", () => {
    const onConfirm = jest.fn();
    const onSkip = jest.fn();

    const { getByTestId } = render(
      <ReferralCodeModal onConfirm={onConfirm} onSkip={onSkip} />,
    );

    fireEvent.press(getByTestId("continue-without-bonus-button"));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
