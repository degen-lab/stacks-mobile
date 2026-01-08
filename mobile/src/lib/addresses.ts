import type {
  NetworkType,
  WalletAccount,
} from "@degenlab/stacks-wallet-kit-core";

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
 * Formats a Stacks address to show first 4 and last 4 characters
 * @param address - The full address string (e.g., "ST13XJ4G348VGDRT5Z791J8GBTB9Z0ESPNCRAPN4E")
 * @returns Formatted address string (e.g., "ST13...APN4E")
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 8) {
    return address;
  }

  const first4 = address.slice(0, 4);
  const last4 = address.slice(-4);

  return `${first4}...${last4}`;
};
