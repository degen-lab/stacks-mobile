import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinApiBaseUrl } from "@/lib/bitcoin/network";
import type {
  BitcoinAddressUtxo,
  BitcoinFeeRecommendation,
} from "@/lib/bitcoin/types";

const jsonHeaders = {
  Accept: "application/json",
};

async function fetchBitcoin<T>(
  network: NetworkType,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${getBitcoinApiBaseUrl(network)}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Bitcoin API request failed (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

export const fetchBitcoinUtxos = (address: string, network: NetworkType) =>
  fetchBitcoin<BitcoinAddressUtxo[]>(network, `/address/${address}/utxo`);

export const fetchBitcoinFeeRecommendation = (network: NetworkType) =>
  fetchBitcoin<BitcoinFeeRecommendation>(network, "/v1/fees/recommended");

export const broadcastBitcoinTransaction = async (
  rawTxHex: string,
  network: NetworkType,
) => {
  const response = await fetch(`${getBitcoinApiBaseUrl(network)}/tx`, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: rawTxHex,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Bitcoin broadcast failed (${response.status})`);
  }

  return response.text();
};
