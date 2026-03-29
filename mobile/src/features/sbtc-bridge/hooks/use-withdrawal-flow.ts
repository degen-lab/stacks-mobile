import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PostConditionMode,
  Pc,
  bufferCV,
  broadcastTransaction,
  deserializeTransaction,
  hexToCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { useEffect } from "react";
import { showMessage } from "react-native-flash-message";

import {
  fetchEmilyWithdrawal,
  fetchRegistryWithdrawal,
  fetchStacksTransaction,
} from "@/api/sbtc-bridge";
import { fetchBitcoinFeeRecommendation } from "@/api/bitcoin/client";
import type { HiroTransaction, SbtcBridgeConfig } from "@/api/sbtc-bridge";
import { getHiroApiBase } from "@/lib/stacks/network";
import { buildUnsignedContractCall } from "@/lib/stacks/transaction-builder";
import { useSignTransaction } from "@/hooks/use-sign-transaction";
import { getActiveWalletAccount } from "@/lib/stacks/active-account";
import { fromBtcToSats } from "@/lib/format/currency";
import { useFeeEstimation } from "@/api/stacks/use-fee";

import {
  decodeBitcoinAddressToClarityRecipient,
  encodeClarityRecipientToBitcoinAddress,
  outputScriptHexToBitcoinAddress,
} from "../utils/address";
import { trackEvent } from "@/lib/analytics";
import { hexToBytes } from "../utils/bytes";
import {
  estimateWithdrawalMaxFee,
  extractRequestIdFromTransaction,
  getWithdrawalStatusFromRegistryValue,
  parseBridgeStatus,
  type BridgeStatus,
} from "../utils/status";

type BridgeResolvedWithdrawal = {
  address: string;
  amount: number;
  requestId: string | null;
  stacksTx: string;
  bitcoinTx: string;
  status: BridgeStatus;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function useWithdrawalMaxFee(config: SbtcBridgeConfig) {
  return useQuery({
    queryKey: ["sbtc-bridge", "withdraw-max-fee", config.network],
    queryFn: async () => {
      const fees = await fetchBitcoinFeeRecommendation(config.network);
      return estimateWithdrawalMaxFee({
        fastestFee: fees.fastestFee,
        multiplier: config.withdrawalFeeMultiplier,
        txSize: config.maxWithdrawalTxSize,
      });
    },
    enabled: config.isEnabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

const WITHDRAWAL_PLACEHOLDER_ARGS = [
  uintCV(10_000),
  tupleCV({
    version: bufferCV(new Uint8Array(1)),
    hashbytes: bufferCV(new Uint8Array(20)),
  }),
  uintCV(1_000),
];

export function useSubmitWithdrawal(
  config: SbtcBridgeConfig,
  stxAddress?: string | null,
) {
  const queryClient = useQueryClient();
  const signTransaction = useSignTransaction();
  const maxFee = useWithdrawalMaxFee(config);
  const [contractAddress = "", contractName = ""] =
    config.sbtcWithdrawalContractId.split(".");
  const stxFeeEstimation = useFeeEstimation({
    contractAddress,
    contractName,
    functionName: "initiate-withdrawal-request",
    functionArgs: WITHDRAWAL_PLACEHOLDER_ARGS,
    network: config.network,
    enabled: config.isEnabled,
  });

  return useMutation({
    mutationKey: [
      "sbtc-bridge",
      "submit-withdrawal",
      config.network,
      stxAddress,
    ],
    mutationFn: async ({
      amount,
      recipientAddress,
    }: {
      amount: string;
      recipientAddress: string;
    }) => {
      if (!config.isEnabled) {
        throw new Error("sBTC bridge is not configured for this network");
      }
      if (!stxAddress) {
        throw new Error("Stacks address is unavailable");
      }
      if (
        maxFee.data == null ||
        !Number.isFinite(maxFee.data) ||
        maxFee.data <= 0
      ) {
        throw new Error("Withdrawal fee estimate is unavailable");
      }

      const stxFeeEstimations = stxFeeEstimation.data;
      const stxFee =
        stxFeeEstimations != null && stxFeeEstimations.length > 0
          ? (stxFeeEstimations[1]?.fee ?? stxFeeEstimations[0]?.fee ?? 200_000)
          : 200_000;

      const { account, accountIndex } = await getActiveWalletAccount();
      const recipient = decodeBitcoinAddressToClarityRecipient(
        recipientAddress,
        config.network,
      );
      const satoshiAmount = fromBtcToSats(amount);
      const satoshiFee = Math.round(maxFee.data);

      const unsignedTx = await buildUnsignedContractCall({
        contractId: config.sbtcWithdrawalContractId,
        functionName: "initiate-withdrawal-request",
        functionArgs: [
          uintCV(satoshiAmount),
          tupleCV({
            version: bufferCV(hexToBytes(recipient.type)),
            hashbytes: bufferCV(recipient.hash),
          }),
          uintCV(satoshiFee),
        ],
        network: config.network,
        publicKey: account.publicKey,
        feeMicroStx: stxFee,
        postConditionMode: PostConditionMode.Deny,
        postConditions: [
          Pc.principal(stxAddress)
            .willSendLte(satoshiAmount + satoshiFee)
            .ft(`${config.contractDeployer}.sbtc-token`, "sbtc-token"),
        ],
      });

      const signedHex = await signTransaction(unsignedTx, accountIndex);
      const txHex = signedHex.startsWith("0x") ? signedHex.slice(2) : signedHex;
      const response = await broadcastTransaction({
        transaction: deserializeTransaction(txHex),
        client: { baseUrl: getHiroApiBase(config.network) },
      });

      const txId =
        typeof (response as { txid?: unknown }).txid === "string"
          ? (response as { txid: string }).txid
          : null;

      if (txId) void trackEvent("bridge_withdrawal_initiated");
      if (!txId) {
        const rejectedResponse = response as {
          reason?: string;
          reason_data?: { message?: string };
        };
        throw new Error(
          rejectedResponse.reason_data?.message ??
            rejectedResponse.reason ??
            "Transaction broadcast failed.",
        );
      }

      queryClient.invalidateQueries({ queryKey: ["sbtc"] });
      return txId;
    },
    onError: (error) => {
      showMessage({
        message: "Withdrawal failed",
        description: getErrorMessage(error),
        type: "danger",
      });
    },
  });
}

async function resolveWithdrawalFromTransaction(
  config: SbtcBridgeConfig,
  tx: HiroTransaction,
): Promise<BridgeResolvedWithdrawal> {
  const functionArgs = tx.contract_call?.function_args ?? [];
  const amountArg = functionArgs[0]?.hex;
  const recipientArg = functionArgs[1]?.hex;

  const amount = amountArg
    ? Number((hexToCV(amountArg) as any).value ?? 0n)
    : 0;
  const recipient = recipientArg ? (hexToCV(recipientArg) as any).value : null;

  const address =
    recipient != null
      ? encodeClarityRecipientToBitcoinAddress(
          recipient.hashbytes.value,
          recipient.version.value,
          config.network,
        )
      : "";

  if (tx.tx_status === "success") {
    const requestId = extractRequestIdFromTransaction(tx);
    if (requestId) {
      try {
        const emily = await fetchEmilyWithdrawal(config, requestId);
        return {
          address: outputScriptHexToBitcoinAddress(
            emily.recipient,
            config.network,
          ),
          amount: emily.amount,
          requestId,
          stacksTx: emily.fulfillment?.StacksTxid ?? tx.tx_id,
          bitcoinTx: emily.fulfillment?.BitcoinTxid ?? "",
          status: parseBridgeStatus(emily.status),
        };
      } catch {
        const registry = await fetchRegistryWithdrawal(config, [
          uintCV(BigInt(requestId)),
        ]);
        return {
          address:
            registry?.recipient != null
              ? encodeClarityRecipientToBitcoinAddress(
                  registry.recipient.hashbytes,
                  registry.recipient.version,
                  config.network,
                )
              : address,
          amount: Number(registry?.amount ?? BigInt(amount)),
          requestId,
          stacksTx: tx.tx_id,
          bitcoinTx: "",
          status: getWithdrawalStatusFromRegistryValue(
            registry?.status ?? null,
          ),
        };
      }
    }
  }

  return {
    address,
    amount,
    requestId: null,
    stacksTx: tx.tx_id,
    bitcoinTx: "",
    status:
      tx.tx_status === "pending" ? ("pending" as const) : ("failed" as const),
  };
}

export function useWithdrawalStatus(config: SbtcBridgeConfig, id?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<BridgeResolvedWithdrawal>({
    queryKey: ["sbtc-bridge", "withdrawal-status", config.network, id],
    queryFn: async () => {
      if (!id) {
        throw new Error("Transaction id is required");
      }

      if (id.length < 64) {
        const emily = await fetchEmilyWithdrawal(config, id);
        return {
          address: outputScriptHexToBitcoinAddress(
            emily.recipient,
            config.network,
          ),
          amount: emily.amount,
          requestId: String(emily.requestId),
          stacksTx: emily.fulfillment?.StacksTxid ?? "",
          bitcoinTx: emily.fulfillment?.BitcoinTxid ?? "",
          status: parseBridgeStatus(emily.status),
        };
      }

      const tx = await fetchStacksTransaction(config, id);
      return resolveWithdrawalFromTransaction(config, tx);
    },
    enabled: config.isEnabled && Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "confirmed" || status === "failed") {
        return false;
      }
      return config.pollingInterval;
    },
  });

  useEffect(() => {
    if (query.data?.status === "confirmed") {
      queryClient.invalidateQueries({ queryKey: ["sbtc"] });
    }
  }, [query.data?.status, queryClient]);

  return query;
}
