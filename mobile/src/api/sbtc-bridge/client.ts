import { cvToHex, type ClarityValue } from "@stacks/transactions";

import { transformClarityValue } from "@/lib/stacks/transform-clarity-value";

import { normalizeAggregateKey } from "./aggregate-key";
import type {
  EmilyDeposit,
  EmilyLimits,
  EmilyWithdrawal,
  HiroTransaction,
  SbtcBridgeConfig,
} from "./types";

type HttpError = Error & { status?: number };

function createHttpError(message: string, status: number): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  return error;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw createHttpError(
      text || `Request failed (${response.status})`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

async function callReadOnly<T>(
  config: SbtcBridgeConfig,
  contractId: string,
  functionName: string,
  args: ClarityValue[] = [],
): Promise<T> {
  const [contractAddress, contractName] = contractId.split(".");
  if (!contractAddress || !contractName) {
    throw new Error(`Invalid contract id: ${contractId}`);
  }

  const response = await fetchJson<{
    okay: boolean;
    cause?: string;
    result: string;
  }>(
    `${config.hiroApiUrl}/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: contractAddress,
        arguments: args.map((arg) => cvToHex(arg)),
      }),
    },
  );

  if (!response.okay) {
    throw new Error(response.cause || "Read-only call failed");
  }

  return transformClarityValue(response.result) as T;
}

export async function fetchBridgeLimits(
  config: SbtcBridgeConfig,
): Promise<EmilyLimits> {
  const result = await fetchJson<{
    pegCap: number | null;
    perDepositCap: number | null;
    perWithdrawalCap: number | null;
    perDepositMinimum: number | null;
    availableToWithdraw: number | null;
  }>(`${config.emilyUrl}/limits`);

  return {
    pegCap: result.pegCap ?? Number.POSITIVE_INFINITY,
    perDepositCap: result.perDepositCap ?? Number.POSITIVE_INFINITY,
    perWithdrawalCap: result.perWithdrawalCap ?? Number.POSITIVE_INFINITY,
    perDepositMinimum: result.perDepositMinimum ?? 0,
    availableToWithdraw: result.availableToWithdraw ?? Number.POSITIVE_INFINITY,
  };
}

export const fetchAggregateKey = async (config: SbtcBridgeConfig) =>
  normalizeAggregateKey(
    await callReadOnly<string>(
      config,
      config.sbtcRegistryContractId,
      "get-current-aggregate-pubkey",
    ),
  );

export const fetchSbtcSupply = (config: SbtcBridgeConfig) =>
  callReadOnly<bigint>(config, config.sbtcTokenContractId, "get-total-supply");

export const fetchSbtcBalance = (
  config: SbtcBridgeConfig,
  args: ClarityValue[],
) =>
  callReadOnly<bigint>(
    config,
    config.sbtcTokenContractId,
    "get-balance-available",
    args,
  );

export const fetchRegistryWithdrawal = (
  config: SbtcBridgeConfig,
  args: ClarityValue[],
) =>
  callReadOnly<null | {
    amount: bigint;
    "block-height": bigint;
    "max-fee": bigint;
    recipient: {
      hashbytes: string;
      version: string;
    };
    sender: string;
    status: boolean | null;
  }>(config, config.sbtcRegistryContractId, "get-withdrawal-request", args);

export const fetchEmilyDeposit = (
  config: SbtcBridgeConfig,
  txid: string,
  vout: number = 0,
) => fetchJson<EmilyDeposit>(`${config.emilyUrl}/deposit/${txid}/${vout}`);

export const postEmilyDeposit = (
  config: SbtcBridgeConfig,
  payload: {
    bitcoinTxid: string;
    bitcoinTxOutputIndex: number;
    reclaimScript: string;
    depositScript: string;
    transactionHex: string;
  },
) =>
  fetchJson<EmilyDeposit>(`${config.emilyUrl}/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const fetchEmilyDepositHistory = (
  config: SbtcBridgeConfig,
  reclaimPubkeys: string[],
) =>
  fetchJson<{ deposits: EmilyDeposit[] }>(
    `${config.emilyUrl}/deposit/reclaim-pubkeys/${reclaimPubkeys.join("-")}`,
  ).then((result) => result.deposits);

export const fetchEmilyWithdrawal = (
  config: SbtcBridgeConfig,
  requestId: string | number,
) => fetchJson<EmilyWithdrawal>(`${config.emilyUrl}/withdrawal/${requestId}`);

export const fetchEmilyWithdrawalHistory = (
  config: SbtcBridgeConfig,
  sender: string,
) =>
  fetchJson<{
    withdrawals: {
      requestId: number;
      stacksBlockHash: string;
      stacksBlockHeight: number;
      recipient: string;
      sender: string;
      amount: number;
      lastUpdateHeight: number;
      lastUpdateBlockHash: string;
      status: string;
      txid: string;
    }[];
  }>(`${config.emilyUrl}/withdrawal/sender/${sender}`).then(
    (result) => result.withdrawals,
  );

export const fetchStacksTransaction = (
  config: SbtcBridgeConfig,
  txid: string,
) => fetchJson<HiroTransaction>(`${config.hiroApiUrl}/extended/v1/tx/${txid}`);
