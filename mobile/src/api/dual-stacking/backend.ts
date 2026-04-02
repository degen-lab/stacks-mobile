import axios from "axios";

import { dualStackingClient } from "../common/backend-client";
import { getStacksDegenApiBase, isMainnet } from "@/lib/stacks/network";
import type {
  DualStackingDataCycleRow,
  DualStackingDataResponse,
  IsEnrolledResponse,
} from "./types";

export type CycleData = {
  "blocks-per-snapshot": bigint;
  "current-cycle-bitcoin-block-height": bigint;
  "current-cycle-stacks-block-height": bigint;
  "current-snapshot-index": bigint;
  "cycle-id": bigint;
  "next-cycle-bitcoin-block-height": bigint;
  "participants-count": bigint;
  "snapshots-per-cycle": bigint;
};

export const NR_CYCLES_PER_YEAR_HARDCODED = 25.02857;

export function normalizeDualStackingDataPayload(
  raw: unknown,
): DualStackingDataResponse {
  if (Array.isArray(raw)) return raw as DualStackingDataResponse;
  if (raw && typeof raw === "object") {
    const payload = raw as Record<string, unknown>;
    if (Array.isArray(payload.data)) {
      return payload.data as DualStackingDataResponse;
    }
    if (Array.isArray(payload.cycles)) {
      return payload.cycles as DualStackingDataResponse;
    }
    if (Array.isArray(payload.rows)) {
      return payload.rows as DualStackingDataResponse;
    }
  }
  return [];
}

export async function fetchDualStackingData(): Promise<DualStackingDataResponse> {
  const { data } = await dualStackingClient.get("/dual-stacking-data", {
    params: {
      network: isMainnet() ? "mainnet" : "testnet",
    },
  });
  return normalizeDualStackingDataPayload(data);
}

export function getLatestDualStackingCycleRow(
  data: unknown,
): DualStackingDataCycleRow | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  let latest: DualStackingDataCycleRow | null = null;
  let maxId = -Infinity;

  for (const row of data) {
    const cycleRow = row as DualStackingDataCycleRow;
    const cycleId = Number(cycleRow?.cycle_id);

    if (!Number.isFinite(cycleId)) continue;
    if (cycleId > maxId) {
      maxId = cycleId;
      latest = cycleRow;
    }
  }

  return latest;
}

const toCycleBigInt = (value: unknown): bigint => {
  const numeric = Number(value);
  return BigInt(Number.isFinite(numeric) ? Math.trunc(numeric) : 0);
};

export function dualStackingRowToCycleData(
  row: DualStackingDataCycleRow,
): CycleData {
  return {
    "blocks-per-snapshot": toCycleBigInt(row.blocks_per_snapshot),
    "current-cycle-bitcoin-block-height": toCycleBigInt(
      row.current_cycle_bitcoin_height,
    ),
    "current-cycle-stacks-block-height": BigInt(0),
    "current-snapshot-index": BigInt(0),
    "cycle-id": toCycleBigInt(row.cycle_id),
    "next-cycle-bitcoin-block-height": toCycleBigInt(
      row.next_cycle_bitcoin_height,
    ),
    "participants-count": toCycleBigInt(row.participants_count),
    "snapshots-per-cycle": toCycleBigInt(row.snapshots_per_cycle),
  };
}

export async function fetchCurrentBurnchainBlockHeight(): Promise<bigint> {
  const base = getStacksDegenApiBase().replace(/\/+$/, "");
  const url = `${base}/v2/pox`;
  const response = await axios.get<{ current_burnchain_block_height?: number }>(
    url,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const height = response.data?.current_burnchain_block_height;
  if (height == null || !Number.isFinite(Number(height))) {
    throw new Error("PoX response missing current_burnchain_block_height");
  }

  return BigInt(Math.trunc(Number(height)));
}

export async function fetchLatestRewardAddress(
  address: string,
): Promise<string | null> {
  const response = await dualStackingClient.get("/get-latest-reward-address", {
    params: { address },
  });

  const payload = response.data;
  if (typeof payload === "string" && payload.length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    for (const key of [
      "reward_address",
      "latestRewardAddress",
      "address",
      "rewardAddress",
    ]) {
      const rewardAddress = value[key];
      if (typeof rewardAddress === "string" && rewardAddress.length > 0) {
        return rewardAddress;
      }
    }
  }

  return null;
}

export function isContractActiveFromDualStackingData(
  dualStackingData: unknown,
  bitcoinBlockHeight: unknown,
): boolean {
  const latest = getLatestDualStackingCycleRow(dualStackingData);
  if (latest == null || latest.current_cycle_bitcoin_height == null) {
    return false;
  }

  const threshold = Number(latest.current_cycle_bitcoin_height);
  const bitcoinHeight =
    typeof bitcoinBlockHeight === "bigint"
      ? Number(bitcoinBlockHeight)
      : Number(bitcoinBlockHeight);

  if (!Number.isFinite(threshold) || !Number.isFinite(bitcoinHeight)) {
    return false;
  }

  return bitcoinHeight >= threshold;
}

export function isDistributionFinalizedForLatestDualStackingCycle(
  data: unknown,
): boolean {
  const latest = getLatestDualStackingCycleRow(data);
  if (!latest) return false;

  const totalRewarded = latest.total_rewarded;
  return totalRewarded !== null && totalRewarded !== undefined;
}

export async function fetchDistributionFinalizedForLatestCycle(): Promise<boolean> {
  const data = await fetchDualStackingData();
  return isDistributionFinalizedForLatestDualStackingCycle(data);
}

export async function fetchIsEnrolled(
  address: string,
  cycleId: number,
): Promise<IsEnrolledResponse> {
  const response = await dualStackingClient.get<IsEnrolledResponse>(
    "/is-enrolled",
    {
      params: {
        address,
        cycle_id: cycleId,
      },
    },
  );

  return response.data;
}
