import { Buffer } from "buffer";

export { toXOnly } from "@/lib/bitcoin/wallet";

export const stripHexPrefix = (value: string) =>
  value.startsWith("0x") ? value.slice(2) : value;

export const hexToBytes = (value: string) =>
  Uint8Array.from(Buffer.from(stripHexPrefix(value), "hex"));

export const bytesToHex = (value: Uint8Array) =>
  Buffer.from(value).toString("hex");

export const equalBytes = (left?: Uint8Array, right?: Uint8Array) => {
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};
