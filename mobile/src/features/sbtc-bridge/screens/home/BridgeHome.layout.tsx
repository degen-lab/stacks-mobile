import type { RefObject } from "react";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { TextInput as RNTextInput } from "react-native";

import { Button, Modal, Text, Toggle, View, colors } from "@/components/ui";
import GradientBorder from "@/components/ui/gradient-border";
import { BtcRouteLogo } from "@/components/ui/icons/btc-route-logo";
import { SbtcRouteLogo } from "@/components/ui/icons/sbtc-route-logo";
import { StacksRouteLogo } from "@/components/ui/icons/stacks-route-logo";
import { Confirmation } from "@/features/transfer/components/send/confirmation";
import type { FeeRateTier } from "@/features/transfer/hooks/use-prepare-btc-send";
import { formatBtcAmount, formatBtcInput } from "@/lib/format/currency";

import { BridgeChipList } from "../../components/bridge-chip-list";
import {
  BridgeAddressRow,
  BridgeDirectionMarker,
  BridgeFieldCard,
} from "../../components/bridge-field-card";
import { BridgeCard, BridgeLayout } from "../../components/bridge-layout";
import type { StatItem } from "../../components/bridge-overview-grid";
import { BridgeOverviewGrid } from "../../components/bridge-overview-grid";
import { BridgeActivityCard } from "../../components/activity-card";
import { BridgeProgressTracker } from "../../components/bridge-progress-tracker";
import { BridgeRouteCard } from "../../components/bridge-route-card";
import { BridgeAmountFieldCard } from "../../components/bridge-amount-field";
import { BridgeTermsSheet } from "../../components/bridge-terms-sheet";
import type { PreparedBridgeDeposit } from "../../hooks/use-deposit-flow";
import {
  getDepositPreviewSteps,
  getWithdrawalPreviewSteps,
} from "../../utils/progress";

const BRIDGE_DEPOSIT_CTA_STROKE = ["#FF9835", "#FC6432"] as const;
const BRIDGE_WITHDRAWAL_CTA_STROKE = ["#F4BF67", "#C97713"] as const;
const BRIDGE_CTA_DISABLED_STROKE = ["#B7B4B0", "#95918C"] as const;

type ChipItem = {
  label: string;
  value: string;
  tone?: string;
  href?: string;
  tooltip?: string;
};

export type OverviewProps = {
  hero: { label: string; value: string; unit: string };
  items: StatItem[];
};

export type DepositFormProps = {
  btcAddress: string | null | undefined;
  stxAddress: string | null | undefined;
  amount: string;
  onAmountChange: (value: string) => void;
  error: string | null;
  maxValue: string | undefined;
  onMax: (() => void) | undefined;
  btcBalance: number;
  isDisabled: boolean;
  onPress: () => void;
  infoChips: ChipItem[];
};

export type WithdrawFormProps = {
  sbtcBalanceBtc: number;
  amount: string;
  onAmountChange: (value: string) => void;
  error: string | null;
  maxValue: string | undefined;
  onMax: (() => void) | undefined;
  address: string;
  onAddressChange: (value: string) => void;
  addressError: string | null;
  isDisabled: boolean;
  onPress: () => void;
  infoChips: ChipItem[];
};

export type HistoryProps = {
  items: { type: "deposit" | "withdrawal"; data: any }[];
  config: any;
  isLoading: boolean;
};

export type TermsProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => Promise<void>;
};

export type ConfirmDepositModalProps = {
  ref: RefObject<BottomSheetModal>;
  preparedDeposit: PreparedBridgeDeposit | undefined;
  isFetching: boolean;
  error: Error | null;
  feeRateTier: FeeRateTier;
  onFeeRateTierChange: (tier: FeeRateTier) => void;
  isPending: boolean;
  depositAmount: string;
  onDismiss: () => void;
  onConfirm: () => Promise<void>;
};

export type ConfirmWithdrawModalProps = {
  ref: RefObject<BottomSheetModal>;
  withdrawAmount: string;
  withdrawAddress: string;
  maxFeeBtc: number;
  isPending: boolean;
  onDismiss: () => void;
  onConfirm: () => Promise<void>;
};

export type BridgeHomeLayoutProps = {
  overview: OverviewProps;
  bridgeUnavailable: boolean;
  tab: "deposit" | "withdraw";
  onTabChange: (tab: "deposit" | "withdraw") => void;
  deposit: DepositFormProps;
  withdraw: WithdrawFormProps;
  history: HistoryProps;
  terms: TermsProps;
  confirmDeposit: ConfirmDepositModalProps;
  confirmWithdraw: ConfirmWithdrawModalProps;
};

export function BridgeHomeLayout({
  overview,
  bridgeUnavailable,
  tab,
  onTabChange,
  deposit,
  withdraw,
  history,
  terms,
  confirmDeposit,
  confirmWithdraw,
}: BridgeHomeLayoutProps) {
  return (
    <BridgeLayout>
      <BridgeOverviewGrid hero={overview.hero} items={overview.items} />

      {bridgeUnavailable ? (
        <BridgeCard title="Bridge unavailable">
          <Text className="font-instrument-sans text-sm leading-5 text-secondary">
            The bridge is not configured for the currently selected network. Set
            the sBTC bridge Emily URL and contract deployer in the mobile env
            file to enable it.
          </Text>
        </BridgeCard>
      ) : (
        <>
          <BridgeCard className="px-4 py-5 mt-5">
            <View className="w-fit mx-auto -mt-10">
              <Toggle
                value={tab}
                onChange={onTabChange}
                variant="card"
                options={[
                  { value: "deposit", label: "Deposit" },
                  { value: "withdraw", label: "Withdraw" },
                ]}
              />
            </View>
            <View className="gap-3">
              <BridgeRouteCard
                isDeposit={tab === "deposit"}
                onSwap={() =>
                  onTabChange(tab === "deposit" ? "withdraw" : "deposit")
                }
              />

              {tab === "deposit" ? (
                <>
                  <BridgeFieldCard label="Source address">
                    <BridgeAddressRow
                      leftSlot={<BtcRouteLogo size={20} />}
                      address={
                        deposit.btcAddress ?? "Bitcoin address unavailable"
                      }
                    />
                  </BridgeFieldCard>

                  <BridgeAmountFieldCard
                    bgColor="white"
                    label="Amount"
                    value={deposit.amount}
                    unit="BTC"
                    onChangeText={deposit.onAmountChange}
                    rightSlot={
                      <Text
                        className="flex-shrink text-right font-instrument-sans-medium text-xs text-sand-500"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        Available balance: {formatBtcAmount(deposit.btcBalance)}{" "}
                        BTC
                      </Text>
                    }
                    maxValue={deposit.maxValue}
                    onMax={deposit.onMax}
                    startIcon={<BtcRouteLogo size={20} />}
                    error={deposit.error}
                  />

                  <BridgeDirectionMarker />

                  <BridgeFieldCard
                    label="Recipient address"
                    helper="Automatically filled from your wallet."
                    bgColor="white"
                  >
                    <BridgeAddressRow
                      leftSlot={<StacksRouteLogo size={20} />}
                      address={
                        deposit.stxAddress ?? "Stacks address unavailable"
                      }
                    />
                  </BridgeFieldCard>

                  <View className="mt-2">
                    <GradientBorder
                      gradient={
                        deposit.isDisabled
                          ? BRIDGE_CTA_DISABLED_STROKE
                          : BRIDGE_DEPOSIT_CTA_STROKE
                      }
                      shadow={{}}
                      angle={0}
                      borderRadius={12}
                      borderWidth={2}
                      innerBackground="#3C3A38"
                      hasShadow={false}
                    >
                      <Button
                        variant="sbtcBridgeCta"
                        label="Bridge BTC to Stacks"
                        size="lg"
                        disabled={deposit.isDisabled}
                        onPress={deposit.onPress}
                      />
                    </GradientBorder>
                  </View>

                  <BridgeChipList items={deposit.infoChips} />
                </>
              ) : (
                <>
                  <BridgeAmountFieldCard
                    bgColor="white"
                    label="Amount"
                    value={withdraw.amount}
                    unit="sBTC"
                    onChangeText={withdraw.onAmountChange}
                    rightSlot={
                      <Text
                        className="flex-shrink text-right font-instrument-sans-medium text-xs text-sand-500"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        Available balance:{" "}
                        {formatBtcAmount(withdraw.sbtcBalanceBtc)} sBTC
                      </Text>
                    }
                    maxValue={withdraw.maxValue}
                    onMax={withdraw.onMax}
                    startIcon={<SbtcRouteLogo size={20} />}
                    error={withdraw.error}
                  />

                  <BridgeDirectionMarker />

                  <BridgeFieldCard
                    label="Bitcoin destination"
                    helper="Defaults to your active BTC wallet, but you can edit it before requesting withdrawal."
                    bgColor="white"
                  >
                    <RNTextInput
                      value={withdraw.address}
                      onChangeText={withdraw.onAddressChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="bc1..."
                      placeholderTextColor={colors.neutral[400]}
                      className="font-instrument-sans text-base leading-6 text-primary"
                      style={{ padding: 0 }}
                    />
                    {withdraw.addressError ? (
                      <Text className="mt-3 font-instrument-sans italic text-sm text-red-500">
                        {withdraw.addressError}
                      </Text>
                    ) : null}
                  </BridgeFieldCard>

                  <GradientBorder
                    gradient={
                      withdraw.isDisabled
                        ? BRIDGE_CTA_DISABLED_STROKE
                        : BRIDGE_WITHDRAWAL_CTA_STROKE
                    }
                    shadow={{}}
                    angle={0}
                    borderRadius={12}
                    borderWidth={2}
                    innerBackground="#3C3A38"
                    hasShadow={false}
                  >
                    <Button
                      label="Request BTC withdrawal"
                      size="lg"
                      variant="sbtcBridgeCta"
                      disabled={withdraw.isDisabled}
                      onPress={withdraw.onPress}
                    />
                  </GradientBorder>
                  <BridgeChipList items={withdraw.infoChips} />
                </>
              )}
            </View>
          </BridgeCard>

          <BridgeProgressTracker
            steps={
              tab === "deposit"
                ? getDepositPreviewSteps()
                : getWithdrawalPreviewSteps()
            }
            mode="preview"
          />

          <Text className="text-xl">Recent Bridge Activity</Text>
          <BridgeActivityCard
            items={history.items}
            config={history.config}
            isLoading={history.isLoading}
          />
        </>
      )}

      <BridgeTermsSheet
        open={terms.isOpen}
        onOpenChange={terms.onOpenChange}
        onAccept={terms.onAccept}
      />

      <Modal
        ref={confirmWithdraw.ref}
        title="Confirm withdrawal"
        snapPoints={["70%"]}
      >
        <Confirmation
          formData={{
            asset: "sBTC",
            amount: confirmWithdraw.withdrawAmount,
            recipient: confirmWithdraw.withdrawAddress,
            memo: "",
            source: "manual",
          }}
          fee={formatBtcInput(confirmWithdraw.maxFeeBtc)}
          isLoading={confirmWithdraw.isPending}
          confirmDisabled={confirmWithdraw.isPending}
          info="A small STX network fee will also be deducted from your STX balance."
          onBack={confirmWithdraw.onDismiss}
          onConfirm={confirmWithdraw.onConfirm}
        />
      </Modal>

      <Modal
        ref={confirmDeposit.ref}
        title="Confirm deposit"
        snapPoints={["70%"]}
        onDismiss={confirmDeposit.onDismiss}
      >
        <Confirmation
          formData={{
            asset: "BTC",
            amount: confirmDeposit.depositAmount,
            recipient: confirmDeposit.preparedDeposit?.depositAddress ?? "",
            memo: "",
            source: "manual",
          }}
          fee={
            confirmDeposit.preparedDeposit
              ? formatBtcInput(confirmDeposit.preparedDeposit.feeSats / 1e8)
              : "..."
          }
          feeRateTier={confirmDeposit.feeRateTier}
          feeRatePerVbyte={confirmDeposit.preparedDeposit?.feeRate}
          onFeeRateTierChange={confirmDeposit.onFeeRateTierChange}
          isLoading={confirmDeposit.isPending}
          confirmDisabled={
            !confirmDeposit.preparedDeposit || confirmDeposit.isPending
          }
          info={
            confirmDeposit.isFetching
              ? "Preparing deposit transaction..."
              : undefined
          }
          error={
            confirmDeposit.error
              ? confirmDeposit.error instanceof Error
                ? confirmDeposit.error.message
                : "Failed to prepare deposit"
              : undefined
          }
          onBack={confirmDeposit.onDismiss}
          onConfirm={confirmDeposit.onConfirm}
        />
      </Modal>
    </BridgeLayout>
  );
}
