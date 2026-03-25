import React from "react";

import { act, fireEvent, render, screen } from "@/lib/tests";

import { BridgeProgressTracker } from "../bridge-progress-tracker";
import type { BridgeProgressStep } from "../../utils/progress";

const detailSteps: BridgeProgressStep[] = [
  {
    id: "lock",
    title: "Lock BTC on Bitcoin",
    state: "complete",
    description: "Your BTC deposit transaction has been broadcast.",
  },
  {
    id: "confirm",
    title: "Confirming deposit",
    state: "complete",
    description: "The Bitcoin network confirmed your deposit.",
  },
  {
    id: "signers",
    title: "Signers confirming deposit",
    state: "active",
    description: "Waiting for Stacks Signers to confirm your deposit",
    timing: {
      kind: "countdown",
      remainingMs: 30 * 60_000,
    },
  },
  {
    id: "minting",
    title: "Minting sBTC on Stacks",
    state: "pending",
    description: "Waiting for the mint transaction to finalize on Stacks",
  },
  {
    id: "complete",
    title: "Transfer complete",
    state: "pending",
    isTerminal: true,
    description: "sBTC received on Stacks address",
    link: {
      label: "View on Stacks Explorer",
      href: "https://explorer.hiro.so/txid",
    },
  },
];

describe("BridgeProgressTracker", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders countdown timing on its own line and updates every minute", () => {
    render(<BridgeProgressTracker steps={detailSteps} />);

    expect(screen.getByText("Estimated time left: ~30 min")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(screen.getByText("Estimated time left: ~29 min")).toBeTruthy();
  });

  it("does not show a collapse toggle in preview mode", () => {
    render(<BridgeProgressTracker steps={detailSteps} mode="preview" />);

    expect(screen.queryByTestId("bridge-progress-toggle")).toBeNull();
  });

  it("expands and collapses hidden middle detail steps", () => {
    render(<BridgeProgressTracker steps={detailSteps} />);

    expect(
      screen.queryByText(
        "Waiting for the mint transaction to finalize on Stacks",
      ),
    ).toBeNull();
    expect(screen.getByTestId("bridge-progress-toggle")).toBeTruthy();

    fireEvent.press(screen.getByTestId("bridge-progress-toggle"));

    expect(
      screen.getByText(
        "Waiting for the mint transaction to finalize on Stacks",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Collapse")).toBeTruthy();
  });

  it("renders links for completed terminal steps", () => {
    render(
      <BridgeProgressTracker
        steps={detailSteps
          .map((step) =>
            step.id === "signers"
              ? { ...step, state: "complete" as const, timing: undefined }
              : step,
          )
          .map((step) =>
            step.id === "minting"
              ? { ...step, state: "complete" as const }
              : step,
          )
          .map((step) =>
            step.id === "complete"
              ? { ...step, state: "complete" as const }
              : step,
          )}
      />,
    );

    expect(screen.getByText("View on Stacks Explorer")).toBeTruthy();
  });

  it("renders estimate timing text on its own line", () => {
    const stepsWithEstimate = detailSteps.map((step) =>
      step.id === "signers"
        ? {
            ...step,
            timing: {
              kind: "estimate" as const,
              text: "Usually ~20 min remaining",
            },
          }
        : step,
    );

    render(<BridgeProgressTracker steps={stepsWithEstimate} />);

    expect(screen.getByText("Usually ~20 min remaining")).toBeTruthy();
  });
});
