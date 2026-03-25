import type { NetworkType } from "@degenlab/stacks-wallet-kit-core";

import { getItem, setItem } from "@/lib/storage/storage";

const STORAGE_KEY_PREFIX = "sbtc-bridge:deposits";

export type StoredBridgeDeposit = {
  txId: string;
  vout: number;
  network: NetworkType;
  reclaimPubkey: string;
  amountSats: number;
  maxFee: number;
  lockTime: number;
  depositScript: string;
  reclaimScript: string;
  rawTxHex: string;
  depositAddress: string;
  recipient: string;
  broadcasted: boolean;
  emilyRegistered: boolean;
  createdAt: number;
  updatedAt: number;
  lastRegistrationAttemptAt?: number;
  lastRegistrationError?: string | null;
  reclaimTxId?: string;
};

const getStorageKey = (network: NetworkType, reclaimPubkey: string) =>
  `${STORAGE_KEY_PREFIX}:${network}:${reclaimPubkey}`;

const depositKey = (txId: string, vout: number) => `${txId}:${vout}`;

async function readDeposits(network: NetworkType, reclaimPubkey: string) {
  return (
    (await getItem<StoredBridgeDeposit[]>(
      getStorageKey(network, reclaimPubkey),
    )) ?? []
  );
}

async function writeDeposits(
  network: NetworkType,
  reclaimPubkey: string,
  deposits: StoredBridgeDeposit[],
) {
  await setItem(getStorageKey(network, reclaimPubkey), deposits);
}

export async function listStoredBridgeDeposits(
  network: NetworkType,
  reclaimPubkey: string,
) {
  return readDeposits(network, reclaimPubkey);
}

export async function getStoredBridgeDeposit(
  network: NetworkType,
  reclaimPubkey: string,
  txId: string,
  vout: number = 0,
) {
  const deposits = await readDeposits(network, reclaimPubkey);
  return (
    deposits.find(
      (deposit) =>
        depositKey(deposit.txId, deposit.vout) === depositKey(txId, vout),
    ) ?? null
  );
}

export async function upsertStoredBridgeDeposit(record: StoredBridgeDeposit) {
  const deposits = await readDeposits(record.network, record.reclaimPubkey);
  const nextRecord = { ...record, updatedAt: Date.now() };
  const nextDeposits = deposits.filter(
    (deposit) =>
      depositKey(deposit.txId, deposit.vout) !==
      depositKey(record.txId, record.vout),
  );
  nextDeposits.unshift(nextRecord);
  await writeDeposits(record.network, record.reclaimPubkey, nextDeposits);
  return nextRecord;
}

export async function updateStoredBridgeDeposit(
  network: NetworkType,
  reclaimPubkey: string,
  txId: string,
  vout: number,
  updater: (current: StoredBridgeDeposit) => StoredBridgeDeposit,
) {
  const deposits = await readDeposits(network, reclaimPubkey);
  const index = deposits.findIndex(
    (deposit) =>
      depositKey(deposit.txId, deposit.vout) === depositKey(txId, vout),
  );

  if (index === -1) return null;

  const nextRecord = { ...updater(deposits[index]), updatedAt: Date.now() };
  const nextDeposits = [...deposits];
  nextDeposits[index] = nextRecord;
  await writeDeposits(network, reclaimPubkey, nextDeposits);
  return nextRecord;
}

export async function replaceStoredBridgeDepositTxId(
  network: NetworkType,
  reclaimPubkey: string,
  txId: string,
  vout: number,
  nextTxId: string,
) {
  return updateStoredBridgeDeposit(
    network,
    reclaimPubkey,
    txId,
    vout,
    (current) => ({ ...current, txId: nextTxId }),
  );
}

export async function markStoredDepositRegistrationAttempt(
  network: NetworkType,
  reclaimPubkey: string,
  txId: string,
  vout: number,
  errorMessage?: string | null,
) {
  return updateStoredBridgeDeposit(
    network,
    reclaimPubkey,
    txId,
    vout,
    (current) => ({
      ...current,
      lastRegistrationAttemptAt: Date.now(),
      lastRegistrationError: errorMessage ?? null,
    }),
  );
}

export async function markStoredDepositReclaimed(
  network: NetworkType,
  reclaimPubkey: string,
  txId: string,
  vout: number,
  reclaimTxId: string,
) {
  const result = await updateStoredBridgeDeposit(
    network,
    reclaimPubkey,
    txId,
    vout,
    (current) => ({ ...current, reclaimTxId }),
  );
  // No existing record — upsert a minimal one so reclaimTxId is always queryable
  if (result === null) {
    await upsertStoredBridgeDeposit({
      txId,
      vout,
      network,
      reclaimPubkey,
      reclaimTxId,
      amountSats: 0,
      maxFee: 0,
      lockTime: 0,
      depositScript: "",
      reclaimScript: "",
      rawTxHex: "",
      depositAddress: "",
      recipient: "",
      broadcasted: true,
      emilyRegistered: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

export async function markStoredDepositEmilyRegistered(
  network: NetworkType,
  reclaimPubkey: string,
  txId: string,
  vout: number,
) {
  return updateStoredBridgeDeposit(
    network,
    reclaimPubkey,
    txId,
    vout,
    (current) => ({
      ...current,
      emilyRegistered: true,
      lastRegistrationError: null,
    }),
  );
}
