import * as btc from "@scure/btc-signer";
import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinSignerNetwork } from "@/lib/bitcoin/network";
import { hexToBytes, stripHexPrefix } from "./bytes";

export { outputScriptHexToBitcoinAddress } from "@/lib/bitcoin/addresses";

const CLARITY_VERSION_BY_TYPE = {
  pkh: "00",
  sh: "01",
  wpkh: "04",
  wsh: "05",
  tr: "06",
} as const;

export function decodeBitcoinAddressToClarityRecipient(
  address: string,
  network: NetworkType,
) {
  const decoded = btc
    .Address(getBitcoinSignerNetwork(network))
    .decode(address.trim());

  if (decoded.type === "pkh") {
    return { type: CLARITY_VERSION_BY_TYPE.pkh, hash: decoded.hash };
  }
  if (decoded.type === "sh") {
    return { type: CLARITY_VERSION_BY_TYPE.sh, hash: decoded.hash };
  }
  if (decoded.type === "wpkh") {
    return { type: CLARITY_VERSION_BY_TYPE.wpkh, hash: decoded.hash };
  }
  if (decoded.type === "wsh") {
    return { type: CLARITY_VERSION_BY_TYPE.wsh, hash: decoded.hash };
  }
  if (decoded.type === "tr") {
    return { type: CLARITY_VERSION_BY_TYPE.tr, hash: decoded.pubkey };
  }

  throw new Error(`Unsupported Bitcoin address type: ${decoded.type}`);
}

export function encodeClarityRecipientToBitcoinAddress(
  hashHex: string,
  versionHex: string,
  network: NetworkType,
) {
  const codec = btc.Address(getBitcoinSignerNetwork(network));
  const hash = hexToBytes(hashHex);
  const version = parseInt(stripHexPrefix(versionHex), 16);

  if (version === 0) {
    return codec.encode({ type: "pkh", hash });
  }
  if (version < 4) {
    return codec.encode({ type: "sh", hash });
  }
  if (version === 4) {
    return codec.encode({ type: "wpkh", hash });
  }
  if (version === 5) {
    return codec.encode({ type: "wsh", hash });
  }
  if (version === 6) {
    return codec.encode({ type: "tr", pubkey: hash });
  }

  throw new Error(`Unsupported recipient version: ${versionHex}`);
}
