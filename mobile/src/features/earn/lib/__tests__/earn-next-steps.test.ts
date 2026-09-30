import { buildEarnNextStepCards } from "../next-steps";

describe("buildEarnNextStepCards", () => {
  it("shows bridge first and buy stx second when the user only has BTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0.5,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0,
      totalStxBalance: 0,
      availableStxBalance: 0,
      lockedStxBalance: 0,
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
      totalStxBalance: 100,
      availableStxBalance: 100,
      lockedStxBalance: 0,
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
      totalStxBalance: 100,
      availableStxBalance: 100,
      lockedStxBalance: 0,
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
      totalStxBalance: 100,
      availableStxBalance: 100,
      lockedStxBalance: 0,
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
      totalStxBalance: 0,
      availableStxBalance: 0,
      lockedStxBalance: 0,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards).toEqual([
      expect.objectContaining({
        id: "get-stx",
        status: "primary",
        action: { type: "acquire", asset: "STX" },
      }),
      expect.objectContaining({
        id: "stack-stx",
        status: "preview",
        action: { type: "stacking" },
      }),
    ]);
  });

  it("shows bridge when stacking with BTC but no sBTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0.5,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0,
      totalStxBalance: 100,
      availableStxBalance: 20,
      lockedStxBalance: 80,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards.map((card) => card.id)).toEqual(["bridge-sbtc"]);
    expect(cards[0]?.description).toBe(
      "Bridge BTC to sBTC to use your Bitcoin on Stacks.",
    );
  });

  it("shows get BTC when stacking with no BTC and no sBTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0,
      totalStxBalance: 100,
      availableStxBalance: 20,
      lockedStxBalance: 80,
      nextRewardPhaseLabel: null,
      stackingApr: 8.4,
    });

    expect(cards).toEqual([
      expect.objectContaining({
        id: "get-btc",
        status: "primary",
        description: "Buy or receive BTC, then bridge it to sBTC.",
      }),
    ]);
  });

  it("shows all set when stacking and already holding sBTC", () => {
    const cards = buildEarnNextStepCards({
      btcBalance: 0.5,
      bridgeDepositMinimumBtc: 0.0001,
      sbtcBalance: 0.00001,
      totalStxBalance: 100,
      availableStxBalance: 20,
      lockedStxBalance: 80,
      nextRewardPhaseLabel: "3d 4h",
      stackingApr: 8.4,
    });

    expect(cards).toEqual([
      expect.objectContaining({
        id: "all-set",
        status: "success",
        description: "Next rewards phase starts in 3d 4h.",
      }),
    ]);
  });
});
