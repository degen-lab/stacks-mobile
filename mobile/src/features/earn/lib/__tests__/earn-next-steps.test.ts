import { buildEarnNextStepCards } from "../next-steps";

describe("buildEarnNextStepCards", () => {
  it("shows bridge first and buy stx second when the user only has BTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0.5,
      sbtcBalance: 0,
      totalStxBalance: 0,
      availableStxBalance: 0,
      lockedStxBalance: 0,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardDateLabel: null,
      stackingApr: 8.4,
    });

    expect(cards.map((card) => card.id)).toEqual(["bridge-sbtc", "get-stx"]);
  });

  it("keeps acquire cards actionable when they render as previews", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0,
      sbtcBalance: 0.2,
      totalStxBalance: 0,
      availableStxBalance: 0,
      lockedStxBalance: 0,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardDateLabel: null,
      stackingApr: 8.4,
    });

    expect(cards).toEqual([
      expect.objectContaining({
        id: "dual-stacking",
        status: "primary",
        action: { type: "dual-stacking" },
      }),
      expect.objectContaining({
        id: "get-stx",
        status: "preview",
        action: { type: "acquire", asset: "STX" },
      }),
    ]);
  });
});
