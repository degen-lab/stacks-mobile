import { useLocalSearchParams, useRouter } from "expo-router";

import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { fromSatsToBtc } from "@/lib/format/currency";

import {
  getBridgeReclaimPubkey,
  useBridgeConfig,
  useBridgeWalletPayment,
} from "../../hooks/use-bridge-data";
import { useDepositStatus } from "../../hooks/use-deposit-flow";
import {
  useReclaimStatus,
  useSubmitReclaim,
} from "../../hooks/use-reclaim-flow";
import { markStoredDepositReclaimed } from "../../storage/deposits";
import { ReclaimLayout } from "./Reclaim.layout";

export function ReclaimScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    txid?: string;
    reclaimTxId?: string;
    vout?: string;
  }>();
  const depositTxId = Array.isArray(params.txid) ? params.txid[0] : params.txid;
  const reclaimTxId = Array.isArray(params.reclaimTxId)
    ? params.reclaimTxId[0]
    : params.reclaimTxId;
  const vout = Array.isArray(params.vout) ? params.vout[0] : params.vout;

  const config = useBridgeConfig();
  const { btcAddress } = useWalletAddresses();
  const payment = useBridgeWalletPayment();
  const deposit = useDepositStatus(config, depositTxId, vout);
  const reclaimPubkey =
    deposit.localDepositInfo?.reclaimPubkey ??
    getBridgeReclaimPubkey(payment.data?.publicKey);
  const reclaim = useSubmitReclaim(config, depositTxId, vout, btcAddress);
  const reclaimStatus = useReclaimStatus(config, reclaimTxId);

  const amountBtc = fromSatsToBtc(deposit.depositInfo?.amount ?? 0);

  const handleSubmitReclaim = async () => {
    const txId = await reclaim.mutateAsync();
    if (depositTxId && reclaimPubkey) {
      await markStoredDepositReclaimed(
        config.network,
        reclaimPubkey,
        depositTxId,
        Number(vout ?? 0),
        txId,
      );
    }
    router.replace({
      pathname: "/Earn/sbtc-bridge/deposit/[txid]/reclaim",
      params: { txid: depositTxId, reclaimTxId: txId, vout },
    });
  };

  return (
    <ReclaimLayout
      depositStatus={deposit.status}
      amountBtc={amountBtc}
      btcAddress={btcAddress}
      reclaimTxId={reclaimTxId}
      reclaimStatus={reclaimStatus.status}
      mempoolUrl={config.publicMempoolUrl}
      isSubmitting={reclaim.isPending}
      onSubmitReclaim={handleSubmitReclaim}
    />
  );
}
