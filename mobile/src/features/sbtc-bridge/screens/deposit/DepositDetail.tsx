import { useRouter, useLocalSearchParams } from "expo-router";

import { useBridgeMempoolBlocks } from "@/api/sbtc-bridge/hooks";
import { BtcRouteLogo } from "@/components/ui/icons/btc-route-logo";
import { StacksRouteLogo } from "@/components/ui/icons/stacks-route-logo";
import { truncateAddress } from "@/lib/stacks/addresses";
import { getExplorerTxUrl } from "@/lib/stacks/network";
import { getBitcoinTransactionFeeRate } from "@/lib/bitcoin/mempool";

import { useBridgeConfig } from "../../hooks/use-bridge-data";
import { useDepositStatus } from "../../hooks/use-deposit-flow";
import { buildDepositProgressSteps } from "../../utils/progress";
import {
  formatBridgeStatusLabel,
  getBridgeStatusChipTone,
  type BridgeDisplayStatus,
} from "../../utils/status";
import { BridgeTransactionDetailLayout } from "../../components/bridge-transaction-detail.layout";

function getScreenTitle(status: string, isReclaimed: boolean) {
  if (isReclaimed) return "Deposit Reclaimed";
  if (status === "confirmed") return "Deposit complete";
  if (status === "failed") return "Deposit expired";
  if (status === "accepted") return "Minting sBTC";
  return "Deposit in progress";
}

export function DepositDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ txid?: string; vout?: string }>();
  const txId = Array.isArray(params.txid) ? params.txid[0] : params.txid;
  const vout = Array.isArray(params.vout) ? params.vout[0] : params.vout;

  const config = useBridgeConfig();
  const {
    status,
    error,
    recipient,
    stacksTxId,
    depositInfo,
    bitcoinTxInfo,
    currentBlockHeight,
    isLoading,
    isRegistrationPending,
    localDepositInfo,
  } = useDepositStatus(config, txId, vout);

  const mempoolBlocks = useBridgeMempoolBlocks(
    config,
    Boolean(txId) && !Boolean(bitcoinTxInfo?.status.confirmed),
  );

  const reclaimTxId = localDepositInfo?.reclaimTxId;
  const isReclaimed = Boolean(reclaimTxId);
  const amount = depositInfo?.amount ?? 0;
  const depositVout = depositInfo?.bitcoinTxOutputIndex ?? Number(vout ?? 0);
  const bitcoinConfirmed = Boolean(bitcoinTxInfo?.status.confirmed);
  const confirmationBlockHeight = bitcoinTxInfo?.status.block_height ?? null;
  const confirmationBlockTime = bitcoinTxInfo?.status.block_time ?? null;
  const bitcoinTransactionFeeRate = getBitcoinTransactionFeeRate(bitcoinTxInfo);
  const stacksExplorerUrl = stacksTxId
    ? getExplorerTxUrl(stacksTxId).explorerUrl
    : undefined;

  const progressSteps = buildDepositProgressSteps({
    status,
    bitcoinConfirmed,
    isRegistrationPending,
    bitcoinTxId: txId,
    stacksTxId,
    mempoolUrl: config.publicMempoolUrl,
    stacksExplorerUrl,
    currentBitcoinTipHeight: currentBlockHeight,
    bitcoinConfirmationBlockHeight: confirmationBlockHeight,
    bitcoinConfirmationBlockTime: confirmationBlockTime,
    bitcoinTransactionFeeRate,
    mempoolProjectedBlocks: mempoolBlocks.data ?? null,
  });

  const displayStatus: BridgeDisplayStatus = isReclaimed
    ? "reclaimed"
    : status === "failed"
      ? "expired"
      : isRegistrationPending
        ? "registration pending"
        : status;

  const summaryChips = [
    {
      label: "Status",
      value: formatBridgeStatusLabel(displayStatus),
      tone: getBridgeStatusChipTone(displayStatus),
    },
    {
      label:
        confirmationBlockHeight != null
          ? "Confirmed at Bitcoin block"
          : "Bitcoin",
      value:
        confirmationBlockHeight != null
          ? `#${confirmationBlockHeight}`
          : bitcoinConfirmed
            ? "Confirmed"
            : "Awaiting confirmation",
    },
  ];

  const transactionChips = isReclaimed
    ? [
        {
          label: "Deposit tx",
          value: txId ? truncateAddress(txId, 6, 6) : "Pending",
          href: txId ? `${config.publicMempoolUrl}/tx/${txId}` : undefined,
        },
        ...(reclaimTxId
          ? [
              {
                label: "Reclaim tx",
                value: truncateAddress(reclaimTxId, 6, 6),
                href: `${config.publicMempoolUrl}/tx/${reclaimTxId}`,
              },
            ]
          : []),
      ]
    : [];

  return (
    <BridgeTransactionDetailLayout
      title={getScreenTitle(status, isReclaimed)}
      isLoading={isLoading}
      error={error}
      isDeposit
      amountSats={amount}
      amountLabel="Deposit amount"
      amountUnit="BTC"
      amountIcon={<BtcRouteLogo size={20} />}
      address={recipient}
      addressLabel="Mint recipient"
      addressHelper="sBTC will arrive in this Stacks account once minting finishes."
      addressIcon={<StacksRouteLogo size={20} />}
      summaryChips={summaryChips}
      transactionChips={transactionChips}
      progressSteps={progressSteps}
      showProgressTracker={!isLoading && !error && !isReclaimed}
      reclaimButton={
        status === "failed" && txId && !isReclaimed
          ? {
              label: "Reclaim deposit",
              onPress: () =>
                router.push({
                  pathname: "/Earn/sbtc-bridge/deposit/[txid]/reclaim",
                  params: { txid: txId, vout: String(depositVout) },
                }),
            }
          : undefined
      }
    />
  );
}
