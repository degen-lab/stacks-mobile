import { HDKey } from "@scure/bip32";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { prepareBitcoinSend } from "../send";
import { deriveBitcoinWalletPaymentFromRootKey } from "../wallet";

describe("prepareBitcoinSend", () => {
  const rootKey = HDKey.fromMasterSeed(new Uint8Array(32).fill(5));
  const sender = deriveBitcoinWalletPaymentFromRootKey(
    rootKey,
    0,
    NetworkType.Testnet,
  );
  const recipient = deriveBitcoinWalletPaymentFromRootKey(
    rootKey,
    1,
    NetworkType.Testnet,
  );

  it("builds a signed transaction with change when funds exceed amount plus fee", () => {
    const prepared = prepareBitcoinSend({
      sender,
      recipient: recipient.address,
      amountSats: 50_000,
      feeRate: 2,
      network: NetworkType.Testnet,
      utxos: [
        {
          txid: "11".repeat(32),
          vout: 0,
          value: 100_000,
          status: { confirmed: true },
        },
      ],
    });

    expect(prepared.txId).toHaveLength(64);
    expect(prepared.rawTxHex.length).toBeGreaterThan(0);
    expect(prepared.amountSats).toBe(50_000);
    expect(prepared.changeSats).toBeGreaterThan(0);
    expect(prepared.amountSats + prepared.changeSats + prepared.feeSats).toBe(
      prepared.inputSats,
    );
  });

  it("folds dust-sized change into the fee", () => {
    const prepared = prepareBitcoinSend({
      sender,
      recipient: recipient.address,
      amountSats: 50_000,
      feeRate: 2,
      network: NetworkType.Testnet,
      utxos: [
        {
          txid: "22".repeat(32),
          vout: 0,
          value: 50_700,
          status: { confirmed: true },
        },
      ],
    });

    expect(prepared.changeSats).toBe(0);
    expect(prepared.feeSats).toBe(700);
  });

  it("throws when balance cannot cover amount plus fee", () => {
    expect(() =>
      prepareBitcoinSend({
        sender,
        recipient: recipient.address,
        amountSats: 50_000,
        feeRate: 2,
        network: NetworkType.Testnet,
        utxos: [
          {
            txid: "33".repeat(32),
            vout: 0,
            value: 50_100,
            status: { confirmed: true },
          },
        ],
      }),
    ).toThrow("Insufficient BTC balance");
  });

  it("throws when recipient address is invalid for the network", () => {
    expect(() =>
      prepareBitcoinSend({
        sender,
        recipient: "bc1qinvalidmainnetaddress",
        amountSats: 10_000,
        feeRate: 2,
        network: NetworkType.Testnet,
        utxos: [
          {
            txid: "44".repeat(32),
            vout: 0,
            value: 100_000,
            status: { confirmed: true },
          },
        ],
      }),
    ).toThrow("valid testnet Bitcoin address");
  });

  it("throws when recipient address is empty", () => {
    expect(() =>
      prepareBitcoinSend({
        sender,
        recipient: "   ",
        amountSats: 10_000,
        feeRate: 2,
        network: NetworkType.Testnet,
        utxos: [
          {
            txid: "44".repeat(32),
            vout: 0,
            value: 100_000,
            status: { confirmed: true },
          },
        ],
      }),
    ).toThrow("Recipient address is required");
  });

  it("throws when amount is zero", () => {
    expect(() =>
      prepareBitcoinSend({
        sender,
        recipient: recipient.address,
        amountSats: 0,
        feeRate: 2,
        network: NetworkType.Testnet,
        utxos: [
          {
            txid: "55".repeat(32),
            vout: 0,
            value: 100_000,
            status: { confirmed: true },
          },
        ],
      }),
    ).toThrow("Amount must be greater than 0");
  });

  it("throws when fee rate is zero", () => {
    expect(() =>
      prepareBitcoinSend({
        sender,
        recipient: recipient.address,
        amountSats: 10_000,
        feeRate: 0,
        network: NetworkType.Testnet,
        utxos: [
          {
            txid: "55".repeat(32),
            vout: 0,
            value: 100_000,
            status: { confirmed: true },
          },
        ],
      }),
    ).toThrow("Unable to estimate the Bitcoin network fee");
  });

  it("throws when there are no UTXOs", () => {
    expect(() =>
      prepareBitcoinSend({
        sender,
        recipient: recipient.address,
        amountSats: 10_000,
        feeRate: 2,
        network: NetworkType.Testnet,
        utxos: [],
      }),
    ).toThrow("No spendable BTC UTXOs found");
  });

  it("selects multiple UTXOs when no single UTXO covers the amount plus fee", () => {
    const prepared = prepareBitcoinSend({
      sender,
      recipient: recipient.address,
      amountSats: 80_000,
      feeRate: 2,
      network: NetworkType.Testnet,
      utxos: [
        {
          txid: "66".repeat(32),
          vout: 0,
          value: 50_000,
          status: { confirmed: true },
        },
        {
          txid: "77".repeat(32),
          vout: 0,
          value: 50_000,
          status: { confirmed: true },
        },
      ],
    });

    expect(prepared.inputSats).toBe(100_000);
    expect(prepared.amountSats).toBe(80_000);
    expect(prepared.amountSats + prepared.changeSats + prepared.feeSats).toBe(
      prepared.inputSats,
    );
  });
});
