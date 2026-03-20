import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hexToCV } from "@stacks/transactions";
import { useRouter } from "expo-router";
import { showMessage } from "react-native-flash-message";

import {
  fetchAggregateKey,
  fetchBridgeLimits,
  fetchEmilyDeposit,
  fetchSbtcSupply,
  postEmilyDeposit,
} from "@/api/sbtc-bridge";
import type { EmilyDeposit, SbtcBridgeConfig } from "@/api/sbtc-bridge";
import {
  broadcastBitcoinTransaction,
  fetchBitcoinFeeRecommendation,
  fetchBitcoinRbf,
  fetchBitcoinTipHeight,
  fetchBitcoinTransaction,
  fetchBitcoinTransactionHex,
  fetchBitcoinUtxos,
} from "@/api/bitcoin/client";
import { fromBtcToSats } from "@/lib/format/currency";
import { pickFeeRate, type FeeRateTier } from "@/lib/bitcoin/fees";

import {
  createDepositAddress,
  createDepositScript,
  createReclaimScript,
  serializeStacksPrincipal,
} from "../builders/deposit";
import { prepareSbtcDeposit } from "../builders/deposit-tx";
import {
  getStoredBridgeDeposit,
  markStoredDepositEmilyRegistered,
  markStoredDepositRegistrationAttempt,
  replaceStoredBridgeDepositTxId,
  type StoredBridgeDeposit,
  updateStoredBridgeDeposit,
  upsertStoredBridgeDeposit,
} from "../storage/deposits";
import { bytesToHex, hexToBytes } from "../utils/bytes";
import { deriveDepositStatus, type BridgeStatus } from "../utils/status";
import {
  getBridgeReclaimPubkey,
  useBridgeWalletPayment,
} from "./use-bridge-data";

const DEPOSIT_MAX_FEE_SATS = 80_000;
const EMILY_REGISTRATION_MAX_ATTEMPTS = 3;
const REGISTRATION_RETRY_INTERVAL_MS = 30_000;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isHttpStatus(error: unknown, status: number) {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status === status
  );
}

function shouldRetryEmilyRegistration(record: StoredBridgeDeposit) {
  if (record.emilyRegistered) return false;
  const lastError = record.lastRegistrationError?.toLowerCase() ?? "";
  if (
    lastError.includes("status code 400") ||
    lastError.includes("status code 403") ||
    lastError.includes("invalid script") ||
    lastError.includes("invalid pubkey")
  ) {
    return false;
  }
  if (!record.lastRegistrationAttemptAt) return true;
  return (
    Date.now() - record.lastRegistrationAttemptAt >=
    REGISTRATION_RETRY_INTERVAL_MS
  );
}

async function registerDepositWithEmily(
  config: SbtcBridgeConfig,
  payload: {
    bitcoinTxid: string;
    bitcoinTxOutputIndex: number;
    reclaimScript: string;
    depositScript: string;
    transactionHex: string;
  },
  attempts: number = EMILY_REGISTRATION_MAX_ATTEMPTS,
) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await postEmilyDeposit(config, payload);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) break;
      await sleep(Math.min(2 ** attempt, 30) * 1000);
    }
  }

  throw lastError;
}

function toStoredBridgeDeposit(
  config: SbtcBridgeConfig,
  prepared: PreparedBridgeDeposit,
  txId: string,
  broadcasted: boolean,
): StoredBridgeDeposit {
  return {
    txId,
    vout: prepared.depositOutputIndex,
    network: config.network,
    reclaimPubkey: prepared.reclaimPubkey,
    amountSats: prepared.amountSats,
    maxFee: prepared.maxFee,
    lockTime: prepared.lockTime,
    depositScript: prepared.depositScript,
    reclaimScript: prepared.reclaimScript,
    rawTxHex: prepared.rawTxHex,
    depositAddress: prepared.depositAddress,
    recipient: prepared.recipient,
    broadcasted,
    emilyRegistered: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export type PreparedBridgeDeposit = {
  txId: string;
  rawTxHex: string;
  reclaimPubkey: string;
  feeSats: number;
  feeRate: number;
  amountSats: number;
  maxFee: number;
  lockTime: number;
  recipient: string;
  depositOutputIndex: number;
  depositAddress: string;
  reclaimScript: string;
  depositScript: string;
};

export type BridgeDepositInfo = {
  bitcoinTxid: string;
  bitcoinTxOutputIndex: number;
  recipient: string;
  amount: number;
  parameters: {
    maxFee: number;
    lockTime: number;
  };
  reclaimScript: string;
  depositScript: string;
  rawTxHex?: string;
  emilyRegistered: boolean;
};

function toBridgeDepositInfo(
  deposit: EmilyDeposit | null,
  stored: StoredBridgeDeposit | null,
): BridgeDepositInfo | null {
  if (deposit) {
    return {
      bitcoinTxid: deposit.bitcoinTxid,
      bitcoinTxOutputIndex: deposit.bitcoinTxOutputIndex,
      recipient: deposit.recipient,
      amount: deposit.amount,
      parameters: {
        maxFee: deposit.parameters.maxFee,
        lockTime: deposit.parameters.lockTime,
      },
      reclaimScript: deposit.reclaimScript,
      depositScript: deposit.depositScript,
      emilyRegistered: true,
    };
  }

  if (!stored) return null;

  return {
    bitcoinTxid: stored.txId,
    bitcoinTxOutputIndex: stored.vout,
    recipient: stored.recipient,
    amount: stored.amountSats,
    parameters: {
      maxFee: stored.maxFee,
      lockTime: stored.lockTime,
    },
    reclaimScript: stored.reclaimScript,
    depositScript: stored.depositScript,
    rawTxHex: stored.rawTxHex,
    emilyRegistered: stored.emilyRegistered,
  };
}

export function usePrepareBridgeDeposit(
  config: SbtcBridgeConfig,
  stxAddress: string | null | undefined,
  amount: string,
  feeRateTier: FeeRateTier = "standard",
  enabled = false,
) {
  const payment = useBridgeWalletPayment();

  return useQuery({
    queryKey: [
      "sbtc-bridge",
      "prepare-deposit",
      config.network,
      stxAddress,
      amount,
      feeRateTier,
    ],
    queryFn: async (): Promise<PreparedBridgeDeposit> => {
      if (!config.isEnabled) {
        throw new Error("sBTC bridge is not configured for this network");
      }
      if (!stxAddress) {
        throw new Error("Stacks address is unavailable");
      }
      if (!payment.data) {
        throw new Error("Bitcoin wallet is unavailable");
      }

      const amountSats = fromBtcToSats(amount);
      const [aggregateKey, utxos, feeRecommendation] = await Promise.all([
        fetchAggregateKey(config),
        fetchBitcoinUtxos(payment.data.address, config.network),
        fetchBitcoinFeeRecommendation(config.network),
      ]);

      const feeRate = pickFeeRate(feeRecommendation, feeRateTier);
      const reclaimScript = createReclaimScript(config.reclaimLockTime, [
        payment.data.publicKey,
      ]);
      const depositScript = createDepositScript(
        hexToBytes(aggregateKey),
        DEPOSIT_MAX_FEE_SATS,
        serializeStacksPrincipal(stxAddress),
      );
      const depositAddress = createDepositAddress({
        network: config.network,
        reclaimScript,
        depositScript,
      });

      const prepared = prepareSbtcDeposit({
        sender: payment.data,
        depositAddress,
        amountSats,
        feeRate,
        network: config.network,
        utxos,
      });

      return {
        txId: prepared.txId,
        rawTxHex: prepared.rawTxHex,
        reclaimPubkey: getBridgeReclaimPubkey(payment.data.publicKey)!,
        feeSats: prepared.feeSats,
        feeRate: prepared.feeRate,
        amountSats,
        maxFee: DEPOSIT_MAX_FEE_SATS,
        lockTime: config.reclaimLockTime,
        recipient: stxAddress,
        depositOutputIndex: prepared.depositOutputIndex,
        depositAddress: prepared.depositAddress,
        reclaimScript: bytesToHex(reclaimScript),
        depositScript: bytesToHex(depositScript),
      };
    },
    enabled:
      enabled &&
      !!stxAddress &&
      !!payment.data &&
      !!amount.trim() &&
      Number.isFinite(fromBtcToSats(amount)) &&
      fromBtcToSats(amount) > 0,
    staleTime: 15_000,
    retry: false,
  });
}

export function useSubmitDeposit(config: SbtcBridgeConfig) {
  const queryClient = useQueryClient();
  const payment = useBridgeWalletPayment();

  return useMutation({
    mutationKey: ["sbtc-bridge", "submit-deposit", config.network],
    mutationFn: async (prepared: PreparedBridgeDeposit) => {
      // Re-fetch fresh cap data immediately before broadcast to catch the race
      // condition where the peg cap fills between form-open and confirmation.
      const [limits, supply] = await Promise.all([
        fetchBridgeLimits(config),
        fetchSbtcSupply(config),
      ]);
      const availableCap = Math.max(
        0,
        Math.min(limits.perDepositCap, limits.pegCap - Number(supply)),
      );
      if (prepared.amountSats > availableCap) {
        throw new Error(
          `Amount exceeds the current deposit cap. Maximum available: ${availableCap} sats.`,
        );
      }
      if (prepared.amountSats < limits.perDepositMinimum) {
        throw new Error(
          `Amount is below the minimum deposit of ${limits.perDepositMinimum} sats.`,
        );
      }

      await upsertStoredBridgeDeposit(
        toStoredBridgeDeposit(config, prepared, prepared.txId, false),
      );

      const broadcastTxId = await broadcastBitcoinTransaction(
        prepared.rawTxHex,
        config.network,
      );
      const txId = broadcastTxId || prepared.txId;

      await upsertStoredBridgeDeposit(
        toStoredBridgeDeposit(config, prepared, txId, true),
      );

      let registrationPending = false;

      try {
        await markStoredDepositRegistrationAttempt(
          config.network,
          prepared.reclaimPubkey,
          txId,
          prepared.depositOutputIndex,
        );
        await registerDepositWithEmily(
          config,
          {
            bitcoinTxid: txId,
            bitcoinTxOutputIndex: prepared.depositOutputIndex,
            reclaimScript: prepared.reclaimScript,
            depositScript: prepared.depositScript,
            transactionHex: prepared.rawTxHex,
          },
          EMILY_REGISTRATION_MAX_ATTEMPTS,
        );
        await markStoredDepositEmilyRegistered(
          config.network,
          prepared.reclaimPubkey,
          txId,
          prepared.depositOutputIndex,
        );
      } catch (emilyError) {
        registrationPending = true;
        await markStoredDepositRegistrationAttempt(
          config.network,
          prepared.reclaimPubkey,
          txId,
          prepared.depositOutputIndex,
          getErrorMessage(emilyError),
        );
        showMessage({
          message: "Registration warning",
          description:
            "Your BTC was sent, but bridge registration is still pending. Keep the deposit details screen available so the app can retry Emily registration safely.",
          type: "warning",
          duration: 7000,
        });
        console.warn(
          "Emily deposit registration failed:",
          getErrorMessage(emilyError),
        );
      }

      return {
        txId,
        vout: prepared.depositOutputIndex,
        reclaimPubkey: prepared.reclaimPubkey,
        registrationPending,
      };
    },
    onSuccess: async ({ txId, vout, reclaimPubkey }) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["bitcoin-utxos", config.network, payment.data?.address],
        }),
        queryClient.invalidateQueries({
          queryKey: ["sbtc-bridge", "deposit-history", config.network],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "sbtc-bridge",
            "local-deposits",
            config.network,
            reclaimPubkey,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "sbtc-bridge",
            "local-deposit",
            config.network,
            reclaimPubkey,
            txId,
            vout,
          ],
        }),
      ]);
    },
    onError: (error) => {
      showMessage({
        message: "Deposit failed",
        description: getErrorMessage(error),
        type: "danger",
      });
    },
  });
}

export function useDepositStatus(
  config: SbtcBridgeConfig,
  txId?: string,
  vout?: string | number,
) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const retryInFlightRef = useRef(false);
  const payment = useBridgeWalletPayment();
  const [status, setStatus] = useState<BridgeStatus>("pending");
  const [emilyDepositInfo, setEmilyDepositInfo] = useState<EmilyDeposit | null>(
    null,
  );
  const [bitcoinTxInfo, setBitcoinTxInfo] = useState<Awaited<
    ReturnType<typeof fetchBitcoinTransaction>
  > | null>(null);
  const [currentBlockHeight, setCurrentBlockHeight] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const reclaimPubkey = useMemo(
    () => getBridgeReclaimPubkey(payment.data?.publicKey),
    [payment.data?.publicKey],
  );
  const outputIndex = useMemo(() => {
    if (typeof vout === "number" && Number.isFinite(vout)) return vout;
    if (typeof vout === "string" && vout.trim()) {
      const parsed = Number(vout);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }, [vout]);

  const localDeposit = useQuery({
    queryKey: [
      "sbtc-bridge",
      "local-deposit",
      config.network,
      reclaimPubkey,
      txId,
      outputIndex,
    ],
    queryFn: async () => {
      if (!txId || !reclaimPubkey) return null;
      return getStoredBridgeDeposit(
        config.network,
        reclaimPubkey,
        txId,
        outputIndex,
      );
    },
    enabled: Boolean(txId && reclaimPubkey),
    staleTime: 0,
  });

  const retryDepositRegistration = useCallback(async () => {
    if (!txId) {
      throw new Error("Deposit transaction id is required");
    }
    if (!reclaimPubkey) {
      throw new Error("Wallet reclaim key is unavailable");
    }

    const stored = await getStoredBridgeDeposit(
      config.network,
      reclaimPubkey,
      txId,
      outputIndex,
    );

    if (!stored || !stored.broadcasted) {
      throw new Error("No local deposit record is available for retry");
    }

    await markStoredDepositRegistrationAttempt(
      config.network,
      reclaimPubkey,
      stored.txId,
      stored.vout,
    );
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "sbtc-bridge",
          "local-deposits",
          config.network,
          stored.reclaimPubkey,
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "sbtc-bridge",
          "local-deposit",
          config.network,
          stored.reclaimPubkey,
          stored.txId,
          stored.vout,
        ],
      }),
    ]);

    try {
      const deposit = await registerDepositWithEmily(
        config,
        {
          bitcoinTxid: stored.txId,
          bitcoinTxOutputIndex: stored.vout,
          reclaimScript: stored.reclaimScript,
          depositScript: stored.depositScript,
          transactionHex: stored.rawTxHex,
        },
        2,
      );

      await markStoredDepositEmilyRegistered(
        config.network,
        stored.reclaimPubkey,
        stored.txId,
        stored.vout,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "sbtc-bridge",
            "local-deposits",
            config.network,
            stored.reclaimPubkey,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "sbtc-bridge",
            "local-deposit",
            config.network,
            stored.reclaimPubkey,
            stored.txId,
            stored.vout,
          ],
        }),
      ]);

      return deposit;
    } catch (error) {
      await markStoredDepositRegistrationAttempt(
        config.network,
        stored.reclaimPubkey,
        stored.txId,
        stored.vout,
        getErrorMessage(error),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "sbtc-bridge",
            "local-deposits",
            config.network,
            stored.reclaimPubkey,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "sbtc-bridge",
            "local-deposit",
            config.network,
            stored.reclaimPubkey,
            stored.txId,
            stored.vout,
          ],
        }),
      ]);
      throw error;
    }
  }, [config, outputIndex, queryClient, reclaimPubkey, txId]);

  const retryRegistration = useMutation({
    mutationKey: [
      "sbtc-bridge",
      "retry-deposit-registration",
      config.network,
      reclaimPubkey,
      txId,
      outputIndex,
    ],
    mutationFn: retryDepositRegistration,
  });

  useEffect(() => {
    if (!txId || !config.isEnabled) return;
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isChecking = false;

    const checkStatus = async () => {
      if (isChecking) return;
      isChecking = true;
      let shouldContinuePolling = true;

      try {
        const stored = reclaimPubkey
          ? await getStoredBridgeDeposit(
              config.network,
              reclaimPubkey,
              txId,
              outputIndex,
            )
          : null;
        let depositInfo: EmilyDeposit | null = null;

        try {
          depositInfo = await fetchEmilyDeposit(config, txId, outputIndex);
          if (!isActive) return;

          setEmilyDepositInfo(depositInfo);
          if (stored && !stored.emilyRegistered) {
            await markStoredDepositEmilyRegistered(
              config.network,
              stored.reclaimPubkey,
              stored.txId,
              stored.vout,
            );
            queryClient.invalidateQueries({
              queryKey: [
                "sbtc-bridge",
                "local-deposit",
                config.network,
                stored.reclaimPubkey,
                stored.txId,
                stored.vout,
              ],
            });
          }
        } catch (depositError) {
          if (isHttpStatus(depositError, 404) && stored?.broadcasted) {
            setEmilyDepositInfo(null);

            if (
              shouldRetryEmilyRegistration(stored) &&
              !retryInFlightRef.current
            ) {
              try {
                retryInFlightRef.current = true;
                depositInfo = await retryDepositRegistration();
                if (!isActive) return;
                setEmilyDepositInfo(depositInfo);
              } catch {
                if (!isActive) return;
              } finally {
                retryInFlightRef.current = false;
              }
            }
          } else {
            throw depositError;
          }
        }

        const txInfo = await fetchBitcoinTransaction(config.network, txId);
        if (!isActive) return;

        if (!txInfo) {
          const replacement = await fetchBitcoinRbf(config.network, txId);
          const replacementTxId = replacement.replacements?.tx?.txid;
          const replacementSource = depositInfo ?? stored;

          if (replacementTxId && replacementSource) {
            const replacementHex = await fetchBitcoinTransactionHex(
              config.network,
              replacementTxId,
            );

            try {
              await registerDepositWithEmily(
                config,
                {
                  bitcoinTxid: replacementTxId,
                  bitcoinTxOutputIndex:
                    "bitcoinTxOutputIndex" in replacementSource
                      ? replacementSource.bitcoinTxOutputIndex
                      : replacementSource.vout,
                  reclaimScript: replacementSource.reclaimScript,
                  depositScript: replacementSource.depositScript,
                  transactionHex: replacementHex,
                },
                2,
              );
            } finally {
              if (stored) {
                await replaceStoredBridgeDepositTxId(
                  config.network,
                  stored.reclaimPubkey,
                  txId,
                  outputIndex,
                  replacementTxId,
                );
                queryClient.invalidateQueries({
                  queryKey: [
                    "sbtc-bridge",
                    "local-deposits",
                    config.network,
                    stored.reclaimPubkey,
                  ],
                });
              }
            }

            if (isActive) {
              router.replace({
                pathname: "/Earn/sbtc-bridge/deposit/[txid]",
                params: { txid: replacementTxId, vout: String(outputIndex) },
              });
            }
          }
          return;
        }

        setBitcoinTxInfo(txInfo);

        if (stored && !stored.broadcasted) {
          await updateStoredBridgeDeposit(
            config.network,
            stored.reclaimPubkey,
            stored.txId,
            stored.vout,
            (current) => ({
              ...current,
              broadcasted: true,
            }),
          );
          queryClient.invalidateQueries({
            queryKey: [
              "sbtc-bridge",
              "local-deposit",
              config.network,
              stored.reclaimPubkey,
              stored.txId,
              stored.vout,
            ],
          });
        }

        const tipHeight = txInfo.status.confirmed
          ? await fetchBitcoinTipHeight(config.network)
          : null;
        if (!isActive) return;

        if (tipHeight != null) {
          setCurrentBlockHeight(tipHeight);
        }

        const nextStatus = deriveDepositStatus({
          emilyStatus: depositInfo?.status ?? "pending",
          bitcoinConfirmed: txInfo.status.confirmed,
          currentBlockHeight: tipHeight ?? undefined,
          confirmationHeight: txInfo.status.block_height,
          lockTime:
            depositInfo?.parameters.lockTime ??
            stored?.lockTime ??
            config.reclaimLockTime,
        });

        setStatus(nextStatus);
        shouldContinuePolling =
          nextStatus !== "confirmed" && nextStatus !== "failed";

        if (nextStatus === "confirmed") {
          queryClient.invalidateQueries({ queryKey: ["sbtc"] });
        }

        if (stored?.broadcasted && !depositInfo) {
          setError(null);
        } else {
          setError(null);
        }
      } catch (nextError) {
        if (isActive) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        isChecking = false;
        if (isActive && shouldContinuePolling) {
          timeoutId = setTimeout(checkStatus, config.pollingInterval);
        }
      }
    };

    void checkStatus();

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    config,
    outputIndex,
    queryClient,
    reclaimPubkey,
    retryDepositRegistration,
    router,
    txId,
  ]);

  const depositInfo = useMemo(
    () => toBridgeDepositInfo(emilyDepositInfo, localDeposit.data ?? null),
    [emilyDepositInfo, localDeposit.data],
  );

  const recipient = useMemo(() => {
    if (!depositInfo?.recipient) return "";

    if (!depositInfo.emilyRegistered) {
      return depositInfo.recipient;
    }

    try {
      return String((hexToCV(depositInfo.recipient) as any).value);
    } catch {
      return depositInfo.recipient;
    }
  }, [depositInfo]);

  return {
    status,
    error,
    recipient,
    stacksTxId:
      emilyDepositInfo?.status === "confirmed"
        ? emilyDepositInfo.fulfillment.StacksTxid
        : "",
    emilyDepositInfo,
    depositInfo,
    localDepositInfo: localDeposit.data ?? null,
    bitcoinTxInfo,
    currentBlockHeight,
    isLoading:
      localDeposit.isLoading ||
      (!error && !emilyDepositInfo && !localDeposit.data && !bitcoinTxInfo),
    isRegistrationPending:
      Boolean(localDeposit.data?.broadcasted) && !Boolean(emilyDepositInfo),
    retryRegistration: retryRegistration.mutateAsync,
    isRetryingRegistration: retryRegistration.isPending,
  };
}
