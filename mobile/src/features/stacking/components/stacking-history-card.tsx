import { StyleSheet, Pressable, Linking } from "react-native";
import {
  openBrowserAsync,
  WebBrowserPresentationStyle,
} from "expo-web-browser";
import { ArrowUpRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { View, Text } from "@/components/ui";
import colors from "@/components/ui/colors";
import { getExplorerTxUrl } from "@/lib/stacks/network";
import type { UserStackingDataRow } from "@/api/stacking";
import { normalizeStackingStatus } from "@/api/stacking/status";
import { useStacksPrice } from "@/api/market/use-stacks-price";

const fmt = (amount: number | string) =>
  Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getStatus = (status: string | number | null | undefined) => {
  const n = normalizeStackingStatus(status).toLowerCase();
  if (n === "success")
    return { dot: "bg-green-500", text: "text-green-600", label: "Success" };
  if (n === "pending")
    return { dot: "bg-amber-500", text: "text-amber-600", label: "Pending" };
  if (n === "processing")
    return {
      dot: "bg-indigo-500",
      text: "text-indigo-600",
      label: "Processing",
    };
  if (n === "notbroadcasted")
    return {
      dot: "bg-neutral-400",
      text: "text-secondary",
      label: "Not broadcasted",
    };
  return { dot: "bg-red-500", text: "text-red-600", label: n || "Failed" };
};

const ACTIVE = new Set(["pending", "processing"]);
const isActive = (s: string | number | null | undefined) =>
  ACTIVE.has(normalizeStackingStatus(s).toLowerCase());

type CardProps = {
  delegation: UserStackingDataRow;
  index: number;
  stxPrice: number | null | undefined;
};

function DelegationCard({ delegation, index, stxPrice }: CardProps) {
  const { colorScheme } = useColorScheme();
  const status = getStatus(delegation.txStatus);
  const stxReward =
    delegation.rewardedStxAmount == null
      ? null
      : Number(delegation.rewardedStxAmount);
  const stackedUsd =
    stxPrice != null ? Number(delegation.amountOfStxStacked) * stxPrice : null;
  const rewardUsd =
    stxReward != null && stxPrice != null ? stxReward * stxPrice : null;

  const cycleRange = `Cycles ${delegation.startCycleId}${delegation.endCycleId ? ` – ${delegation.endCycleId}` : " – ongoing"}`;
  const { explorerUrl } = getExplorerTxUrl(delegation.txId);
  const linkIconColor =
    colorScheme === "dark" ? colors.charcoal[300] : colors.neutral[500];

  const openExplorer = async () => {
    if (process.env.EXPO_OS !== "web") {
      await openBrowserAsync(explorerUrl, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
      return;
    }
    await Linking.openURL(explorerUrl);
  };

  return (
    <View className="rounded-2xl border border-surface-secondary bg-sand-100 p-4 dark:bg-surface-primary">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-matter text-lg text-primary">
              Delegation #{index}
            </Text>
            <View className="flex-row items-center gap-1">
              <View className={`h-2 w-2 rounded-full ${status.dot}`} />
              <Text
                className={`text-xs font-instrument-sans-medium ${status.text}`}
              >
                {status.label}
              </Text>
            </View>
          </View>
          <Text className="mt-0.5 text-xs font-instrument-sans text-secondary">
            {delegation.poolName}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => pressed && styles.pressed}
          onPress={() => void openExplorer()}
          accessibilityRole="link"
          accessibilityLabel="View on chain"
        >
          <View className="flex-row items-center gap-1 rounded-lg border border-surface-secondary px-2.5 py-1.5">
            <Text className="text-xs font-instrument-sans-medium text-secondary">
              View on chain
            </Text>
            <ArrowUpRight size={11} color={linkIconColor} />
          </View>
        </Pressable>
      </View>

      <View className="mt-4 gap-2.5 border-t border-surface-secondary/40 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-instrument-sans text-secondary">
            Period
          </Text>
          <Text className="text-sm font-instrument-sans-medium text-primary">
            {cycleRange}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-instrument-sans text-secondary">
            Delegated
          </Text>
          <Text className="text-sm font-instrument-sans-medium text-primary">
            {fmt(delegation.amountOfStxStacked)} STX
            {stackedUsd != null ? ` • $${fmt(stackedUsd)}` : ""}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-instrument-sans text-secondary">
            Rewards earned
          </Text>
          <Text className="text-sm font-instrument-sans-medium text-primary">
            {stxReward == null
              ? "Pending"
              : `+${fmt(stxReward)} STX${rewardUsd != null ? ` • $${fmt(rewardUsd)}` : ""}`}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="mb-2 text-xs font-instrument-sans-medium uppercase tracking-widest text-secondary">
      {label}
    </Text>
  );
}

type Props = {
  delegations: UserStackingDataRow[];
  isLoading?: boolean;
  isError?: boolean;
};

export function StackingHistoryCard({
  delegations = [],
  isLoading = false,
  isError = false,
}: Props) {
  const { data: stxMarketData } = useStacksPrice();
  const stxPrice = stxMarketData?.usd ?? null;

  if (isLoading && delegations.length === 0) {
    return (
      <Text className="text-sm font-instrument-sans text-secondary">
        Loading delegation history…
      </Text>
    );
  }

  if (isError && delegations.length === 0) {
    return (
      <Text className="text-sm font-instrument-sans text-secondary">
        Could not load stacking history right now.
      </Text>
    );
  }

  if (delegations.length === 0) {
    return (
      <Text className="text-sm font-instrument-sans text-secondary">
        No delegations found for this wallet yet.
      </Text>
    );
  }

  const totalStacked = delegations.reduce(
    (acc, r) => acc + Number(r.amountOfStxStacked),
    0,
  );
  const totalRewards = delegations.reduce(
    (acc, r) => acc + Number(r.rewardedStxAmount ?? 0),
    0,
  );
  const hasPending = delegations.some((r) => r.rewardedStxAmount == null);
  const totalStackedUsd = stxPrice != null ? totalStacked * stxPrice : null;
  const totalRewardsUsd = stxPrice != null ? totalRewards * stxPrice : null;

  const active = delegations.filter((d) => isActive(d.txStatus));
  const completed = delegations.filter((d) => !isActive(d.txStatus));
  const showLabels = active.length > 0 && completed.length > 0;

  return (
    <View className="gap-3">
      <View className="rounded-2xl border border-surface-secondary bg-sand-100 p-4 dark:bg-surface-primary">
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Total delegations
            </Text>
            <Text className="text-sm font-instrument-sans-medium text-primary">
              {delegations.length}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Total stacked
            </Text>
            <Text className="text-sm font-instrument-sans-medium text-primary">
              {fmt(totalStacked)} STX
              {totalStackedUsd != null ? ` • $${fmt(totalStackedUsd)}` : ""}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-instrument-sans text-secondary">
              Total rewards
            </Text>
            <Text className="text-sm font-instrument-sans-medium text-primary">
              {fmt(totalRewards)}
              {hasPending ? "+" : ""} STX
              {totalRewardsUsd != null
                ? ` • $${fmt(totalRewardsUsd)}${hasPending ? "+" : ""}`
                : ""}
            </Text>
          </View>
        </View>
      </View>

      {active.length > 0 && (
        <View className="gap-3">
          {showLabels && <SectionLabel label="Active" />}
          {active.map((d, i) => (
            <DelegationCard
              key={d.id}
              delegation={d}
              index={i + 1}
              stxPrice={stxPrice}
            />
          ))}
        </View>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <View className="gap-3">
          {showLabels && <SectionLabel label="History" />}
          {completed.map((d, i) => (
            <DelegationCard
              key={d.id}
              delegation={d}
              index={active.length + i + 1}
              stxPrice={stxPrice}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.5 },
});
