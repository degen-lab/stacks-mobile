import { buildEarnNextStepCards } from "../next-steps";

describe("buildEarnNextStepCards", () => {
  it("shows bridge first and buy stx second when the user only has BTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0.5,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0,
      meetsMinimumSbtcForEnrollment: false,
      totalStxBalance: 0,
      availableStxBalance: 0,
      lockedStxBalance: 0,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards.map((card) => card.id)).toEqual(["bridge-sbtc", "get-stx"]);
  });

  it("shows get BTC as the secondary step when stacking is available but BTC is missing", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0,
      meetsMinimumSbtcForEnrollment: false,
      totalStxBalance: 100,
      availableStxBalance: 100,
      lockedStxBalance: 0,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards).toEqual([
      expect.objectContaining({
        id: "stack-stx",
        status: "primary",
      }),
      expect.objectContaining({
        id: "get-btc",
        status: "preview",
        action: { type: "acquire", asset: "BTC" },
      }),
    ]);
  });

  it("does not block bridge decisions when the BTC balance is still unknown", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: null,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0,
      meetsMinimumSbtcForEnrollment: false,
      totalStxBalance: 100,
      availableStxBalance: 100,
      lockedStxBalance: 0,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards).toEqual([
      expect.objectContaining({
        id: "stack-stx",
        status: "primary",
      }),
      expect.objectContaining({
        id: "get-btc",
        status: "preview",
        action: { type: "acquire", asset: "BTC" },
      }),
    ]);
  });

  it("shows get BTC instead of bridge when BTC is below the bridge minimum", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0.00001,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0,
      meetsMinimumSbtcForEnrollment: false,
      totalStxBalance: 100,
      availableStxBalance: 100,
      lockedStxBalance: 0,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards).toEqual([
      expect.objectContaining({
        id: "stack-stx",
        status: "primary",
      }),
      expect.objectContaining({
        id: "get-btc",
        status: "preview",
        action: { type: "acquire", asset: "BTC" },
      }),
    ]);
  });

  it("keeps acquire cards actionable when they render as previews", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0.2,
      meetsMinimumSbtcForEnrollment: true,
      totalStxBalance: 0,
      availableStxBalance: 0,
      lockedStxBalance: 0,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardPhaseLabel: null,
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

  it("shows bridge ahead of enroll when stacking with below-min sBTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0.5,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0.00001,
      meetsMinimumSbtcForEnrollment: false,
      totalStxBalance: 100,
      availableStxBalance: 20,
      lockedStxBalance: 80,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards.map((card) => card.id)).toEqual([
      "bridge-sbtc",
      "dual-stacking",
    ]);
    expect(cards[1]?.description).toBe(
      "Add more sBTC to enroll in Dual Stacking.",
    );
  });

  it("shows get BTC ahead of enroll when stacking with below-min sBTC and no BTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0.00001,
      meetsMinimumSbtcForEnrollment: false,
      totalStxBalance: 100,
      availableStxBalance: 20,
      lockedStxBalance: 80,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards.map((card) => card.id)).toEqual(["get-btc", "dual-stacking"]);
    expect(cards[0]?.description).toBe(
      "Buy or receive BTC, then bridge it to sBTC.",
    );
    expect(cards[1]?.description).toBe(
      "Add more sBTC to enroll in Dual Stacking.",
    );
    expect(cards[1]?.status).toBe("preview");
  });

  it("shows enroll benefit copy when stacking with no BTC and no sBTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0,
      meetsMinimumSbtcForEnrollment: false,
      totalStxBalance: 100,
      availableStxBalance: 20,
      lockedStxBalance: 80,
      isEnrolledCurrentCycle: false,
      isEnrolledNextCycle: false,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards.map((card) => card.id)).toEqual(["get-btc", "dual-stacking"]);
    expect(cards[1]?.description).toBe(
      "Use sBTC to enroll and start earning rewards.",
    );
    expect(cards[1]?.status).toBe("preview");
  });
});
