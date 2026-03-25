import { cvToHex, tupleCV, uintCV } from "@stacks/transactions";

import type { HiroTransaction } from "@/api/sbtc-bridge";

import {
  deriveDepositStatus,
  estimateWithdrawalMaxFee,
  extractRequestIdFromTransaction,
  getWithdrawalStatusFromRegistryValue,
} from "../utils/status";

describe("sBTC bridge status utils", () => {
  it("keeps deposits pending until the bitcoin transaction confirms", () => {
    expect(
      deriveDepositStatus({
        emilyStatus: "pending",
        bitcoinConfirmed: false,
        currentBlockHeight: 500,
        confirmationHeight: 490,
        lockTime: 144,
      }),
    ).toBe("pending");
  });

  it("marks a confirmed accepted deposit as accepted", () => {
    expect(
      deriveDepositStatus({
        emilyStatus: "accepted",
        bitcoinConfirmed: true,
        currentBlockHeight: 500,
        confirmationHeight: 490,
        lockTime: 144,
      }),
    ).toBe("accepted");
  });

  it("marks an expired pending deposit as failed after lock time", () => {
    expect(
      deriveDepositStatus({
        emilyStatus: "pending",
        bitcoinConfirmed: true,
        currentBlockHeight: 633,
        confirmationHeight: 490,
        lockTime: 144,
      }),
    ).toBe("failed");
  });

  it("estimates the withdrawal max fee from mempool fee data", () => {
    expect(
      estimateWithdrawalMaxFee({
        fastestFee: 12,
        multiplier: 4,
        txSize: 180,
      }),
    ).toBe(8640);
  });

  it("extracts the Emily request id from a smart-contract log event", () => {
    const tx: HiroTransaction = {
      tx_id: "0".repeat(64),
      tx_status: "success",
      events: [
        {
          event_type: "smart_contract_log",
          contract_log: {
            value: {
              hex: cvToHex(
                tupleCV({
                  "request-id": uintCV(42),
                }),
              ),
            },
          },
        },
      ],
    };

    expect(extractRequestIdFromTransaction(tx)).toBe("42");
  });

  it("maps registry status flags to display statuses", () => {
    expect(getWithdrawalStatusFromRegistryValue(null)).toBe("pending");
    expect(getWithdrawalStatusFromRegistryValue(true)).toBe("confirmed");
    expect(getWithdrawalStatusFromRegistryValue(false)).toBe("failed");
  });
});
