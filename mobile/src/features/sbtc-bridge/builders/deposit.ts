import * as btc from "@scure/btc-signer";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";
import { cvToHex, principalCV } from "@stacks/transactions";

import { getBitcoinSignerNetwork } from "@/lib/bitcoin/network";

import { hexToBytes, toXOnly } from "../utils/bytes";

export const NUMS_X_COORDINATE = new Uint8Array([
  0x50, 0x92, 0x9b, 0x74, 0xc1, 0xa0, 0x49, 0x54, 0xb7, 0x8b, 0x4b, 0x60, 0x35,
  0xe9, 0x7a, 0x5e, 0x07, 0x8a, 0x5a, 0x0f, 0x28, 0xec, 0x96, 0xd5, 0x47, 0xbf,
  0xee, 0x9a, 0xce, 0x80, 0x3a, 0xc0,
]);

const flipEndian = (buffer: Uint8Array): Uint8Array => {
  const flipped = new Uint8Array(buffer.length);
  for (let index = 0; index < buffer.length; index += 1) {
    flipped[index] = buffer[buffer.length - 1 - index];
  }
  return flipped;
};

export const serializeStacksPrincipal = (address: string) =>
  hexToBytes(cvToHex(principalCV(address)));

export const createDepositScript = (
  signersPubKey: Uint8Array,
  maxFee: number,
  recipientBytes: Uint8Array,
) => {
  // Always embed the x-only (32-byte) form of the signer key. Emily and the
  // sBTC signers validate the deposit tapscript against BIP342, which requires
  // a 32-byte x-only key in the CHECKSIG position. Confirmed via real mainnet
  // Emily deposits: the push opcode before the key is always 0x20 (32 bytes),
  // never 0x21 (33 bytes).
  const xOnlySignerKey = toXOnly(signersPubKey);
  const littleEndianMaxFee = new Uint8Array(8);
  const view = new DataView(littleEndianMaxFee.buffer);
  view.setUint32(0, maxFee, true);

  const bigEndianMaxFee = flipEndian(littleEndianMaxFee);
  const opDropData = new Uint8Array(
    bigEndianMaxFee.length + recipientBytes.length,
  );
  opDropData.set(bigEndianMaxFee);
  opDropData.set(recipientBytes, bigEndianMaxFee.length);

  return btc.Script.encode([opDropData, "DROP", xOnlySignerKey, "CHECKSIG"]);
};

export const createReclaimScript = (
  lockTime: number,
  leafPubkeys: Uint8Array[],
  threshold: number = 1,
) => {
  if (leafPubkeys.length < 1) {
    throw new Error("Incorrect number of leaf public keys");
  }

  if (threshold > leafPubkeys.length || threshold <= 0) {
    throw new Error("Incorrect threshold");
  }

  const leafScriptAsm: btc.ScriptType = [toXOnly(leafPubkeys[0]), "CHECKSIG"];

  if (leafPubkeys.length > 1) {
    for (const pubkey of leafPubkeys.slice(1)) {
      leafScriptAsm.push(toXOnly(pubkey), "CHECKSIGADD");
    }
    leafScriptAsm.push(threshold, "NUMEQUAL");
  }

  return btc.Script.encode([
    lockTime,
    "CHECKSEQUENCEVERIFY",
    "DROP",
    ...leafScriptAsm,
  ]);
};

export const createDepositPayment = ({
  network,
  reclaimScript,
  depositScript,
}: {
  network: NetworkType;
  reclaimScript: Uint8Array;
  depositScript: Uint8Array;
}) =>
  btc.p2tr(
    NUMS_X_COORDINATE,
    [{ script: depositScript }, { script: reclaimScript }],
    getBitcoinSignerNetwork(network),
    true,
  );

export const createDepositAddress = ({
  network,
  reclaimScript,
  depositScript,
}: {
  network: NetworkType;
  reclaimScript: Uint8Array;
  depositScript: Uint8Array;
}) => {
  const payment = createDepositPayment({
    network,
    reclaimScript,
    depositScript,
  });

  if (!payment.address) {
    throw new Error("Could not create deposit address");
  }

  return payment.address;
};
