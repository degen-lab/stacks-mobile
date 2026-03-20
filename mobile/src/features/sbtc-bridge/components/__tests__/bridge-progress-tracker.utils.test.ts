import { getBridgeProgressRenderItems } from "../bridge-progress-tracker.utils";
import type { BridgeProgressStep } from "../../utils/progress";

const detailSteps: BridgeProgressStep[] = [
  { id: "lock", title: "Lock BTC on Bitcoin", state: "complete" },
  { id: "confirm", title: "Confirming deposit", state: "complete" },
  { id: "signers", title: "Signers confirming deposit", state: "active" },
  { id: "minting", title: "Minting sBTC on Stacks", state: "pending" },
  {
    id: "complete",
    title: "Transfer complete",
    state: "pending",
    isTerminal: true,
  },
];

describe("bridge progress tracker render items", () => {
  it("shows all steps in preview mode without a toggle", () => {
    const items = getBridgeProgressRenderItems({
      steps: detailSteps,
      mode: "preview",
      collapsible: true,
      expanded: false,
    });

    expect(items).toHaveLength(5);
    expect(items.every((item) => item.kind === "step")).toBe(true);
  });

  it("collapses the middle detail steps by default", () => {
    const items = getBridgeProgressRenderItems({
      steps: detailSteps,
      mode: "detail",
      collapsible: true,
      expanded: false,
    });

    expect(items.map((item) => item.kind)).toEqual([
      "step",
      "step",
      "step",
      "toggle",
      "step",
    ]);
    expect(items[3]).toMatchObject({ kind: "toggle", hiddenCount: 1 });
  });

  it("expands the hidden middle steps in detail mode", () => {
    const items = getBridgeProgressRenderItems({
      steps: detailSteps,
      mode: "detail",
      collapsible: true,
      expanded: true,
    });

    expect(items.map((item) => item.kind)).toEqual([
      "step",
      "step",
      "step",
      "toggle",
      "step",
      "step",
    ]);
  });

  it("shows all steps without a toggle when there is no active or failed step", () => {
    const items = getBridgeProgressRenderItems({
      steps: detailSteps.map((step) => ({
        ...step,
        state: step.isTerminal ? "complete" : "complete",
      })),
      mode: "detail",
      collapsible: true,
      expanded: false,
    });

    expect(items).toHaveLength(5);
    expect(items.every((item) => item.kind === "step")).toBe(true);
  });

  it("keeps the failed step visible and collapses remaining detail steps", () => {
    const failedSteps = detailSteps.map((step, index) =>
      index === 2 ? { ...step, state: "failed" as const } : step,
    );

    const items = getBridgeProgressRenderItems({
      steps: failedSteps,
      mode: "detail",
      collapsible: true,
      expanded: false,
    });

    expect(items.map((item) => item.kind)).toEqual([
      "step",
      "step",
      "step",
      "toggle",
      "step",
    ]);
  });
});
