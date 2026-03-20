import { Button, Text, View } from "@/components/ui";
import { ExternalLink } from "@/components/external-link";

import { BridgeCard, BridgeLayout } from "../../components/bridge-layout";

type ReclaimLayoutProps = {
  depositStatus: string;
  amountBtc: number;
  btcAddress: string | null | undefined;
  reclaimTxId: string | undefined;
  reclaimStatus: string;
  mempoolUrl: string;
  isSubmitting: boolean;
  onSubmitReclaim: () => Promise<void>;
};

export function ReclaimLayout({
  depositStatus,
  amountBtc,
  btcAddress,
  reclaimTxId,
  reclaimStatus,
  mempoolUrl,
  isSubmitting,
  onSubmitReclaim,
}: ReclaimLayoutProps) {
  return (
    <BridgeLayout title="Reclaim deposit">
      <BridgeCard title="Reclaim">
        <Text className="font-instrument-sans text-sm text-secondary">
          Amount:{" "}
          {amountBtc.toLocaleString(undefined, { maximumFractionDigits: 8 })}{" "}
          BTC
        </Text>
        <Text className="font-instrument-sans text-sm text-secondary">
          Return to: {btcAddress ?? "Unavailable"}
        </Text>
        <Text className="font-instrument-sans text-sm text-secondary capitalize">
          Deposit status: {depositStatus}
        </Text>
        {reclaimTxId ? (
          <Text className="font-instrument-sans text-sm text-secondary capitalize">
            Reclaim status: {reclaimStatus}
          </Text>
        ) : null}
      </BridgeCard>

      {depositStatus !== "failed" ? (
        <BridgeCard title="Not reclaimable yet">
          <Text className="font-instrument-sans text-sm text-secondary">
            This deposit can only be reclaimed after it expires without minting.
          </Text>
        </BridgeCard>
      ) : reclaimTxId ? (
        <BridgeCard title="Reclaim links">
          <ExternalLink href={`${mempoolUrl}/tx/${reclaimTxId}` as any}>
            <Text className="font-instrument-sans text-sm text-primary underline">
              View reclaim transaction
            </Text>
          </ExternalLink>
        </BridgeCard>
      ) : null}

      <View className="flex-row gap-3">
        {depositStatus === "failed" && !reclaimTxId ? (
          <Button
            label="Submit reclaim"
            size="lg"
            loading={isSubmitting}
            onPress={onSubmitReclaim}
          />
        ) : null}
      </View>
    </BridgeLayout>
  );
}
