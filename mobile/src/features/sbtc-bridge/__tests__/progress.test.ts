import {
  buildDepositProgressSteps,
  buildWithdrawalProgressSteps,
  getDepositConfirmationTiming,
} from "../utils/progress";

function createProjectedBlock(minFee: number) {
  return {
    blockSize: 1_000_000,
    blockVSize: 1_000_000,
    nTx: 2_000,
    totalFees: 100_000,
    medianFee: minFee + 5,
    feeRange: [minFee, minFee + 5, minFee + 10],
  };
}

describe("sBTC bridge progress utils", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("estimates unconfirmed deposit ETA from projected mempool blocks", () => {
    const steps = buildDepositProgressSteps({
      status: "pending",
      bitcoinConfirmed: false,
      bitcoinTxId: "btc-txid",
      mempoolUrl: "https://mempool.space",
      bitcoinTransactionFeeRate: 15,
      mempoolProjectedBlocks: [
        createProjectedBlock(20),
        createProjectedBlock(10),
      ],
    });

    expect(steps[1].timing).toEqual({
      kind: "estimate",
      text: "Estimated time left: ~20 min",
    });
  });

  it("builds a countdown to the 6-confirmation target after first confirmation", () => {
    expect(
      getDepositConfirmationTiming({
        currentBitcoinTipHeight: 100,
        bitcoinConfirmationBlockHeight: 100,
        bitcoinConfirmationBlockTime: 1_735_689_600,
      }),
    ).toEqual({
      kind: "countdown",
      remainingMs: 50 * 60_000,
    });
  });

  it("falls back to remaining confirmation blocks when block time is missing", () => {
    expect(
      getDepositConfirmationTiming({
        currentBitcoinTipHeight: 102,
        bitcoinConfirmationBlockHeight: 100,
      }),
    ).toEqual({
      kind: "countdown",
      remainingMs: 30 * 60_000,
    });
  });

  it("keeps the Bitcoin confirmation step active until 6 confirmations", () => {
    const steps = buildDepositProgressSteps({
      status: "pending",
      bitcoinConfirmed: true,
      bitcoinTxId: "btc-txid",
      mempoolUrl: "https://mempool.space",
      currentBitcoinTipHeight: 102,
      bitcoinConfirmationBlockHeight: 100,
      bitcoinConfirmationBlockTime: 1_735_689_600,
    });

    expect(steps[1].state).toBe("active");
    expect(steps[2].state).toBe("pending");
  });

  it("uses the signer estimate while registration is pending", () => {
    const steps = buildDepositProgressSteps({
      status: "pending",
      bitcoinConfirmed: true,
      isRegistrationPending: true,
      bitcoinTxId: "btc-txid",
      mempoolUrl: "https://mempool.space",
      currentBitcoinTipHeight: 105,
      bitcoinConfirmationBlockHeight: 100,
    });

    expect(steps[2].timing).toEqual({
      kind: "estimate",
      text: "Usually ~5–10 min remaining",
    });
  });

  it("uses the minting estimate for accepted deposits", () => {
    const steps = buildDepositProgressSteps({
      status: "accepted",
      bitcoinConfirmed: true,
      bitcoinTxId: "btc-txid",
      mempoolUrl: "https://mempool.space",
    });

    expect(steps[3].timing).toEqual({
      kind: "estimate",
      text: "Usually ~5 min remaining",
    });
  });

  it("uses the stacks confirmation estimate for pending withdrawals", () => {
    const steps = buildWithdrawalProgressSteps({
      status: "pending",
      stacksTxId: "stacks-txid",
      stacksExplorerUrl: "https://explorer.hiro.so/txid",
      mempoolUrl: "https://mempool.space",
    });

    expect(steps[1].timing).toEqual({
      kind: "estimate",
      text: "Usually ~10 min remaining",
    });
  });

  it("uses the signer estimate for accepted withdrawals", () => {
    const steps = buildWithdrawalProgressSteps({
      status: "accepted",
      stacksTxId: "stacks-txid",
      stacksExplorerUrl: "https://explorer.hiro.so/txid",
      mempoolUrl: "https://mempool.space",
    });

    expect(steps[2].timing).toEqual({
      kind: "estimate",
      text: "Usually ~20 min remaining",
    });
  });
});
