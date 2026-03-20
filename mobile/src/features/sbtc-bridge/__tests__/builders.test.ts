import { HDKey } from "@scure/bip32";
import * as btc from "@scure/btc-signer";
import { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import type { BitcoinAddressUtxo } from "@/lib/bitcoin/types";
import { getBitcoinSignerNetwork } from "@/lib/bitcoin/network";

import {
  createDepositAddress,
  createDepositScript,
  createReclaimScript,
  serializeStacksPrincipal,
} from "../builders/deposit";
import { prepareSbtcDeposit } from "../builders/deposit-tx";
import { createReclaimTransaction } from "../builders/reclaim";
import { bytesToHex } from "../utils/bytes";

function createTestPayment() {
  const seed = new Uint8Array(32).fill(7);
  const root = HDKey.fromMasterSeed(seed);
  const addressKey = root.derive("m/84'/1'/0'/0/0");

  if (!addressKey.privateKey || !addressKey.publicKey) {
    throw new Error("Unable to derive test bitcoin key");
  }

  const networkType = NetworkType.Testnet;
  const network = getBitcoinSignerNetwork(networkType);
  const payment = btc.p2wpkh(addressKey.publicKey, network);

  if (!payment.address) {
    throw new Error("Unable to derive test bitcoin address");
  }

  return {
    address: payment.address,
    script: payment.script,
    publicKey: addressKey.publicKey,
    privateKey: addressKey.privateKey,
    derivationPath: "m/84'/1'/0'/0/0",
    network,
  };
}

function createScripts() {
  const payment = createTestPayment();
  const recipient = serializeStacksPrincipal("ST000000000000000000002AMW42H");
  const reclaimScript = createReclaimScript(144, [payment.publicKey]);
  const depositScript = createDepositScript(
    payment.publicKey,
    80_000,
    recipient,
  );

  return { payment, reclaimScript, depositScript };
}

describe("sBTC bridge builders", () => {
  it("encodes the deposit script with a big-endian max fee prefix", () => {
    const { payment } = createScripts();
    const recipient = serializeStacksPrincipal("ST000000000000000000002AMW42H");
    const script = createDepositScript(payment.publicKey, 80_000, recipient);

    const decoded = btc.Script.decode(script);

    expect(
      bytesToHex(decoded[0] as Uint8Array).startsWith("0000000000013880"),
    ).toBe(true);
    expect(decoded[1]).toBe("DROP");
    // Key must be x-only (32 bytes) — confirmed by real mainnet Emily deposits
    expect(bytesToHex(decoded[2] as Uint8Array)).toBe(
      bytesToHex(payment.publicKey.subarray(1)),
    );
    expect((decoded[2] as Uint8Array).length).toBe(32);
    expect(decoded[3]).toBe("CHECKSIG");
  });

  it("embeds the x-only (32-byte) signer key in the deposit script", () => {
    const { payment } = createScripts();
    const recipient = serializeStacksPrincipal("ST000000000000000000002AMW42H");
    const script = createDepositScript(payment.publicKey, 80_000, recipient);
    const decoded = btc.Script.decode(script);
    const embeddedKey = decoded[2] as Uint8Array;

    // Emily validates BIP342 tapscript: CHECKSIG key must be 32 bytes (x-only).
    // Confirmed via real mainnet Emily deposits — push opcode is always 0x20.
    expect(embeddedKey.length).toBe(32);
    expect(bytesToHex(embeddedKey)).toBe(
      bytesToHex(payment.publicKey.subarray(1)),
    );
  });

  it("encodes reclaim scripts with CSV and multisig threshold checks", () => {
    const payment = createTestPayment();
    const secondKey = new Uint8Array(payment.publicKey);
    secondKey[secondKey.length - 1] ^= 0x01;

    const script = createReclaimScript(144, [payment.publicKey, secondKey], 2);
    const decoded = btc.Script.decode(script);
    const encodedLockTime = Array.from(decoded[0] as Uint8Array);

    expect(encodedLockTime).toEqual([144, 0]);
    expect(decoded[1]).toBe("CHECKSEQUENCEVERIFY");
    expect(decoded[2]).toBe("DROP");
    expect(decoded).toContain("CHECKSIGADD");
    expect(decoded).toContain(2);
    expect(decoded[decoded.length - 1]).toBe("NUMEQUAL");
  });

  it("creates a testnet taproot deposit address for the script tree", () => {
    const { reclaimScript, depositScript } = createScripts();
    const address = createDepositAddress({
      network: NetworkType.Testnet,
      reclaimScript,
      depositScript,
    });

    expect(address.startsWith("tb1p")).toBe(true);
  });

  it("prepares a signed BTC deposit transaction", () => {
    const { payment, reclaimScript, depositScript } = createScripts();
    const depositAddress = createDepositAddress({
      network: NetworkType.Testnet,
      reclaimScript,
      depositScript,
    });
    const utxos: BitcoinAddressUtxo[] = [
      {
        txid: "11".repeat(32),
        vout: 0,
        value: 250_000,
        status: { confirmed: true, block_height: 100 },
      },
    ];

    const prepared = prepareSbtcDeposit({
      sender: payment,
      depositAddress,
      amountSats: 120_000,
      feeRate: 2,
      network: NetworkType.Testnet,
      utxos,
    });

    expect(prepared.txId).toHaveLength(64);
    expect(prepared.rawTxHex.length).toBeGreaterThan(0);
    expect(prepared.depositOutputIndex).toBeGreaterThanOrEqual(0);
    expect(prepared.changeSats).toBeGreaterThan(0);
  });

  it("rejects a deposit when the wallet does not have enough BTC", () => {
    const { payment, reclaimScript, depositScript } = createScripts();
    const depositAddress = createDepositAddress({
      network: NetworkType.Testnet,
      reclaimScript,
      depositScript,
    });

    expect(() =>
      prepareSbtcDeposit({
        sender: payment,
        depositAddress,
        amountSats: 500_000,
        feeRate: 5,
        network: NetworkType.Testnet,
        utxos: [
          {
            txid: "22".repeat(32),
            vout: 0,
            value: 100_000,
            status: { confirmed: true, block_height: 100 },
          },
        ],
      }),
    ).toThrow("Insufficient BTC balance for amount plus network fee");
  });

  it("builds a reclaim transaction from Emily deposit metadata", () => {
    const { payment, reclaimScript, depositScript } = createScripts();
    const reclaim = createReclaimTransaction({
      network: NetworkType.Testnet,
      payment,
      depositAmount: 120_000,
      feeAmount: 5_000,
      lockTime: 144,
      depositScript: bytesToHex(depositScript),
      reclaimScript: bytesToHex(reclaimScript),
      txId: "33".repeat(32),
      vout: 1,
      bitcoinReturnAddress: payment.address,
    });

    expect(reclaim.txId).toHaveLength(64);
    expect(reclaim.rawTxHex.length).toBeGreaterThan(0);
  });
});
