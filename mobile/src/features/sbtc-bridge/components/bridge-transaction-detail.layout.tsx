import type { ReactNode } from "react";

import { Button, Text, View } from "@/components/ui";

import type { BridgeChip } from "./bridge-chip-list";
import { BridgeChipList } from "./bridge-chip-list";
import {
  BridgeAmountFieldCard,
  formatAmountFromSats,
} from "./bridge-amount-field";
import { BridgeAddressRow, BridgeFieldCard } from "./bridge-field-card";
import { BridgeCard, BridgeLayout } from "./bridge-layout";
import { BridgeProgressTracker } from "./bridge-progress-tracker";
import { BridgeRouteCard } from "./bridge-route-card";
import { BridgeDetailCardSkeleton } from "./bridge-detail-card.skeleton";
import type { BridgeProgressStep } from "../utils/progress";

export type BridgeTransactionDetailLayoutProps = {
  title: string;
  isLoading: boolean;
  error: string | null | undefined;

  isDeposit: boolean;
  amountSats: number;
  amountLabel: string;
  amountUnit: string;
  amountIcon: ReactNode;

  address: string | null | undefined;
  addressLabel: string;
  addressHelper: string;
  addressIcon: ReactNode;

  summaryChips: BridgeChip[];
  transactionChips?: BridgeChip[];
  progressSteps: BridgeProgressStep[];
  showProgressTracker: boolean;

  reclaimButton?: { label: string; onPress: () => void };
};

export function BridgeTransactionDetailLayout({
  title,
  isLoading,
  error,
  isDeposit,
  amountSats,
  amountLabel,
  amountUnit,
  amountIcon,
  address,
  addressLabel,
  addressHelper,
  addressIcon,
  summaryChips,
  transactionChips,
  progressSteps,
  showProgressTracker,
  reclaimButton,
}: BridgeTransactionDetailLayoutProps) {
  return (
    <BridgeLayout title={title}>
      <BridgeCard className="overflow-hidden">
        {isLoading ? (
          <BridgeDetailCardSkeleton />
        ) : error ? (
          <Text className="font-instrument-sans text-sm text-red-500">
            {error}
          </Text>
        ) : (
          <>
            <BridgeRouteCard isDeposit={isDeposit} actionIcon="down" />

            <View className="mt-4 gap-3">
              <BridgeAmountFieldCard
                label={amountLabel}
                value={formatAmountFromSats(amountSats)}
                unit={amountUnit}
                locked
                startIcon={amountIcon}
              />

              <BridgeFieldCard label={addressLabel} helper={addressHelper}>
                <BridgeAddressRow
                  leftSlot={addressIcon}
                  address={address || "Address unavailable"}
                />
              </BridgeFieldCard>

              <View className="gap-2">
                <BridgeChipList items={summaryChips} />
                {transactionChips && transactionChips.length > 0 ? (
                  <BridgeChipList items={transactionChips} />
                ) : null}
              </View>
            </View>
          </>
        )}
      </BridgeCard>

      {showProgressTracker ? (
        <BridgeProgressTracker steps={progressSteps} />
      ) : null}

      {reclaimButton ? (
        <View className="gap-3">
          <Button
            label={reclaimButton.label}
            variant="sbtcBridgeCta"
            size="lg"
            onPress={reclaimButton.onPress}
          />
        </View>
      ) : null}
    </BridgeLayout>
  );
}
