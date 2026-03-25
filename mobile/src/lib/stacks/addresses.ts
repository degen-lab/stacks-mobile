import type {
  NetworkType,
  WalletAccount,
} from "@degenlab/stacks-wallet-kit-core";
import { cvToHex, principalCV } from "@stacks/transactions";

/**
 * Gets the appropriate address for a wallet account based on the network type.
 * @param account - The wallet account containing mainnet and testnet addresses
 * @param network - The network type (mainnet, testnet, or devnet)
 * @returns The address string for the specified network
 */
export function getAddressForNetwork(
  account: WalletAccount,
  network: NetworkType,
): string {
  return network === "mainnet"
    ? account.addresses.mainnet
    : account.addresses.testnet;
}

/**
 * Truncates a Stacks address to show the first `head` and last `tail` characters
 * @param address - The full address string (e.g., "ST13XJ4G348VGDRT5Z791J8GBTB9Z0ESPNCRAPN4E")
 * @returns Truncated address string (e.g., "ST13...APN4E")
 */
export const truncateAddress = (
  address: string,
  head = 4,
  tail = 4,
): string => {
  if (!address || address.length <= head + tail + 3) return address;
  return `${address.slice(0, head)}...${address.slice(-tail)}`;
};

export const formatContractIdentifier = (
  identifier: string,
  head = 4,
  tail = 4,
): string => {
  const [contractPrincipal, assetName] = identifier.split("::");
  if (!contractPrincipal) return identifier;

  const separatorIndex = contractPrincipal.indexOf(".");
  if (separatorIndex === -1) {
    const formattedAddress = truncateAddress(contractPrincipal, head, tail);
    return assetName ? `${formattedAddress} :: ${assetName}` : formattedAddress;
  }

  const address = contractPrincipal.slice(0, separatorIndex);
  const formattedAddress = truncateAddress(address, head, tail);

  return assetName ? `${formattedAddress} :: ${assetName}` : formattedAddress;
};

export const principalHexFromAddress = (address: string | null): string =>
  address ? cvToHex(principalCV(address)) : "";

export const principalArgFromAddress = (address: string | null) =>
  address ? [principalCV(address)] : [];

export const isValidPrincipal = (address: string | null | undefined) => {
  const value = address?.trim();
  if (!value) return false;

  try {
    principalCV(value);
    return true;
  } catch {
    return false;
  }
};
