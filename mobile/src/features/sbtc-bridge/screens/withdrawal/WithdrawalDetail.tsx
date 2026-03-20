import { useLocalSearchParams } from "expo-router";

import { BtcDarkerLogo } from "@/components/ui/icons/btc-darker-logo";
import { SbtcRouteLogo } from "@/components/ui/icons/sbtc-route-logo";
import { getExplorerTxUrl } from "@/lib/stacks/network";

import { useBridgeConfig } from "../../hooks/use-bridge-data";
import { useWithdrawalStatus } from "../../hooks/use-withdrawal-flow";
import { buildWithdrawalProgressSteps } from "../../utils/progress";
import {
  formatBridgeStatusLabel,
  getBridgeStatusChipTone,
} from "../../utils/status";
import { BridgeTransactionDetailLayout } from "../../components/bridge-transaction-detail.layout";

function getScreenTitle(status: string) {
  if (status === "confirmed") return "Withdrawal complete";
  if (status === "failed") return "Withdrawal failed";
  if (status === "accepted") return "Processing withdrawal";
  return "Withdrawal in progress";
}

export function WithdrawalDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const config = useBridgeConfig();
  const withdrawal = useWithdrawalStatus(config, id);

  const data = withdrawal.data;
  const status = data?.status ?? "pending";
  const stacksExplorerUrl = data?.stacksTx
    ? getExplorerTxUrl(data.stacksTx).explorerUrl
    : undefined;

  const progressSteps = buildWithdrawalProgressSteps({
    status,
    stacksTxId: data?.stacksTx,
    bitcoinTxId: data?.bitcoinTx,
    mempoolUrl: config.publicMempoolUrl,
    stacksExplorerUrl,
  });

  const summaryChips = data
    ? [
        {
          label: "Status",
          value: formatBridgeStatusLabel(status),
          tone: getBridgeStatusChipTone(status),
        },
        ...(data.requestId
          ? [{ label: "Request id", value: data.requestId }]
          : []),
      ]
    : [];

  return (
    <BridgeTransactionDetailLayout
      title={data ? getScreenTitle(status) : "Withdrawal status"}
      isLoading={withdrawal.isLoading}
      error={withdrawal.error?.message}
      isDeposit={false}
      amountSats={data?.amount ?? 0}
      amountLabel="Withdrawal amount"
      amountUnit="sBTC"
      amountIcon={<SbtcRouteLogo size={20} />}
      address={data?.address}
      addressLabel="Bitcoin recipient"
      addressHelper="BTC will arrive at this Bitcoin address once the withdrawal is processed."
      addressIcon={<BtcDarkerLogo size={20} withShadow={false} />}
      summaryChips={summaryChips}
      progressSteps={progressSteps}
      showProgressTracker={
        !withdrawal.isLoading && !withdrawal.error && Boolean(data)
      }
    />
  );
}
