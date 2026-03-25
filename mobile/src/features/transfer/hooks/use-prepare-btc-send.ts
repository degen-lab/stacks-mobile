import { useQuery } from "@tanstack/react-query";

import {
  fetchBitcoinFeeRecommendation,
  fetchBitcoinUtxos,
} from "@/api/bitcoin";
import { fromBtcToSats } from "@/lib/format/currency";
import {
  useActiveAccountIndex,
  useSelectedNetwork,
} from "@/lib/store/settings";
import { prepareBitcoinSend } from "@/lib/bitcoin/send";
import { getBitcoinWalletPayment } from "@/lib/bitcoin/wallet";
import { pickFeeRate, type FeeRateTier } from "@/lib/bitcoin/fees";

export type { FeeRateTier } from "@/lib/bitcoin/fees";

type Params = {
  recipient: string;
  amount: string;
  feeRateTier?: FeeRateTier;
  enabled?: boolean;
};

export function usePrepareBtcSend({
  recipient,
  amount,
  feeRateTier = "standard",
  enabled = true,
}: Params) {
  const { activeAccountIndex } = useActiveAccountIndex();
  const { selectedNetwork } = useSelectedNetwork();
  const amountSats = fromBtcToSats(amount);

  return useQuery({
    queryKey: [
      "bitcoin-send-quote",
      selectedNetwork,
      activeAccountIndex,
      recipient,
      amount,
      feeRateTier,
    ],
    queryFn: async () => {
      const payment = await getBitcoinWalletPayment(
        activeAccountIndex,
        selectedNetwork,
      );
      const [utxos, feeRecommendation] = await Promise.all([
        fetchBitcoinUtxos(payment.address, selectedNetwork),
        fetchBitcoinFeeRecommendation(selectedNetwork),
      ]);

      return prepareBitcoinSend({
        sender: payment,
        recipient,
        amountSats,
        feeRate: pickFeeRate(feeRecommendation, feeRateTier),
        network: selectedNetwork,
        utxos,
      });
    },
    enabled:
      enabled &&
      !!recipient.trim() &&
      !!amount.trim() &&
      Number.isFinite(amountSats) &&
      amountSats > 0,
    staleTime: 15_000,
    retry: false,
  });
}
