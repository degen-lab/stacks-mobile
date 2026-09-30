import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getBitcoinApiBaseUrl } from "@/lib/bitcoin/network";
import type {
  BitcoinAddressInfo,
  BitcoinAddressUtxo,
  BitcoinFeeRecommendation,
  MempoolTransaction,
  MempoolProjectedBlock,
  MempoolRbfResponse,
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
    signal: AbortSignal.timeout(15_000),
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

async function fetchBitcoinText(
  network: NetworkType,
  path: string,
  init?: RequestInit,
): Promise<string> {
  const url = `${getBitcoinApiBaseUrl(network)}${path}`;
  const response = await fetch(url, init);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Bitcoin API request failed (${response.status})`,
    );
  }

  return response.text();
}

export const fetchBitcoinUtxos = (address: string, network: NetworkType) =>
  fetchBitcoin<BitcoinAddressUtxo[]>(network, `/address/${address}/utxo`);

export const fetchBitcoinAddressInfo = (
  address: string,
  network: NetworkType,
) => fetchBitcoin<BitcoinAddressInfo>(network, `/address/${address}`);

export const fetchBitcoinFeeRecommendation = (network: NetworkType) =>
  fetchBitcoin<BitcoinFeeRecommendation>(network, "/v1/fees/recommended");

export async function fetchBitcoinTransaction(
  network: NetworkType,
  txid: string,
): Promise<MempoolTransaction | null> {
  const url = `${getBitcoinApiBaseUrl(network)}/tx/${txid}`;
  const response = await fetch(url, { headers: jsonHeaders });
  if (response.status === 404) return null;
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Bitcoin API request failed (${response.status})`,
    );
  }
  return response.json() as Promise<MempoolTransaction>;
}

export const fetchBitcoinTransactionHex = (
  network: NetworkType,
  txid: string,
) => fetchBitcoinText(network, `/tx/${txid}/hex`);

export const fetchBitcoinRbf = (network: NetworkType, txid: string) =>
  fetchBitcoin<MempoolRbfResponse>(network, `/v1/tx/${txid}/rbf`);

export const fetchBitcoinTipHeight = (network: NetworkType) =>
  fetchBitcoinText(network, "/blocks/tip/height").then(Number);

export const fetchMempoolProjectedBlocks = (network: NetworkType) =>
  fetchBitcoin<MempoolProjectedBlock[]>(network, "/v1/fees/mempool-blocks");

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
