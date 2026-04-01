import { ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleX,
  Undo2,
} from "lucide-react-native";
import { hexToCV } from "@stacks/transactions";

import { Text, View } from "@/components/ui";
import { LinkUnderline } from "@/components/ui/link-underline";
import {
  useBitcoinTipHeight,
  useBitcoinTransaction,
  useStacksTransaction,
} from "@/api/sbtc-bridge/hooks";
import type {
  BridgeHistoryItem,
  SbtcBridgeConfig,
} from "@/api/sbtc-bridge/types";
import { fromSatsToBtc } from "@/lib/format/currency";
import { truncateAddress } from "@/lib/stacks/addresses";
import { outputScriptHexToBitcoinAddress } from "../utils/address";
import { deriveDepositStatus } from "../utils/status";

// ─── Address decoding ─────────────────────────────────────────────────────────

// Deposit recipient is a hex-encoded Clarity principal from Emily
function decodeDepositRecipient(recipient: string): string {
  try {
    return String((hexToCV(recipient) as any).value);
  } catch {
    return recipient; // local deposit — already a plain STX address
  }
}

// Withdrawal recipient is a raw output script hex from Emily
function decodeWithdrawalRecipient(
  recipient: string,
  config: SbtcBridgeConfig,
): string {
  try {
    return outputScriptHexToBitcoinAddress(recipient, config.network);
  } catch {
    return recipient;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ActivityStatus = "pending" | "failed" | "confirmed" | "reclaimed";

function getDisplayStatus(status: string): ActivityStatus {
  if (status === "confirmed") return "confirmed";
  if (status === "failed") return "failed";
  if (status === "reclaimed") return "reclaimed";
  return "pending";
}

function formatAmount(sats: number) {
  return fromSatsToBtc(sats).toLocaleString(undefined, {
    maximumFractionDigits: 8,
  });
}

function getItemKey(item: BridgeHistoryItem): string {
  if (item.type === "deposit") return `deposit-${item.data.bitcoinTxid}`;
  return `withdrawal-${item.data.txid}`;
}

function getItemHref(
  item: BridgeHistoryItem,
): Parameters<ReturnType<typeof useRouter>["push"]>[0] {
  if (item.type === "deposit") {
    return {
      pathname: "/Earn/sbtc-bridge/deposit/[txid]",
      params: {
        txid: item.data.bitcoinTxid,
        vout: String(item.data.bitcoinTxOutputIndex),
      },
    };
  }
  return {
    pathname: "/Earn/sbtc-bridge/withdraw/[id]",
    params: { id: item.data.txid },
  };
}

// ─── Direction icon ───────────────────────────────────────────────────────────

function DirectionIcon({ type }: { type: BridgeHistoryItem["type"] }) {
  if (type === "deposit") {
    return (
      <View className="w-4 h-4 rounded-full bg-accent-bitcoin-600 items-center justify-center">
        <ArrowDown size={10} color="white" strokeWidth={2.5} />
      </View>
    );
  }
  return (
    <View className="w-4 h-4 rounded-full bg-accent-stacks-700 items-center justify-center">
      <ArrowUp size={10} color="white" strokeWidth={2.5} />
    </View>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ActivityStatus }) {
  if (status === "confirmed") {
    return (
      <View className="flex-row items-center gap-1 p-1 rounded-lg border bg-feedback-green-150 border-feedback-green-150">
        <CheckCircle2 strokeWidth={2.5} size={14} color="#30A46C" />
      </View>
    );
  }

  if (status === "failed") {
    return (
      <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEE2E2]">
        <CircleX size={11} color="#E32A35" strokeWidth={2.5} />
        <Text className="font-instrument-sans-medium text-xs text-primary">
          Failed
        </Text>
      </View>
    );
  }

  if (status === "reclaimed") {
    return (
      <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-[#E0F2FE]">
        <Undo2 size={11} color="#0284C7" strokeWidth={2.5} />
        <Text className="font-instrument-sans-medium text-xs text-primary">
          Reclaimed
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF0E8]">
      <ActivityIndicator
        size="small"
        color="#FC6432"
        style={{ width: 14, height: 14, transform: [{ scale: 0.55 }] }}
      />
      <Text className="font-instrument-sans-medium text-xs text-stacks-blood-orange">
        Pending
      </Text>
    </View>
  );
}

// ─── Activity row ─────────────────────────────────────────────────────────────

function formatTimestamp(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function ActivityRow({
  item,
  config,
}: {
  item: BridgeHistoryItem;
  config: SbtcBridgeConfig;
}) {
  const unit = item.type === "deposit" ? "BTC" : "sBTC";

  // Deposit: fetch BTC tx for sender address + block_time timestamp
  const btcTx = useBitcoinTransaction(
    config,
    item.type === "deposit" ? item.data.bitcoinTxid : "",
    item.type === "deposit",
  );

  // Withdrawal: fetch Stacks tx for burn_block_time timestamp
  const stacksTx = useStacksTransaction(
    config,
    item.type === "withdrawal" ? item.data.txid : "",
    item.type === "withdrawal",
  );

  // Accurate tip height shared via React Query cache — zero extra network calls
  const tipHeight = useBitcoinTipHeight(config, item.type === "deposit");

  // For deposits, compute the derived status using the real confirmation height
  // once the BTC tx has loaded. Falls back to the pre-computed status otherwise.
  const status: ActivityStatus = (() => {
    if (item.data.status === "reclaimed") return "reclaimed";
    if (
      item.type === "deposit" &&
      btcTx.data &&
      item.data.parameters?.lockTime != null
    ) {
      const emilyStatus =
        item.data.status === "accepted"
          ? "accepted"
          : item.data.status === "confirmed"
            ? "confirmed"
            : "pending";
      const derived = deriveDepositStatus({
        emilyStatus,
        bitcoinConfirmed: btcTx.data.status.confirmed,
        currentBlockHeight: tipHeight.data ?? undefined,
        confirmationHeight: btcTx.data.status.block_height,
        lockTime: item.data.parameters.lockTime,
      });
      // "accepted" maps to "pending" badge — both mean in-progress
      if (derived === "accepted") return "pending";
      return derived as ActivityStatus;
    }
    return getDisplayStatus(item.data.status);
  })();

  const from =
    item.type === "deposit"
      ? truncateAddress(
          btcTx.data?.vin[0]?.prevout?.scriptpubkey_address ?? "",
          4,
          5,
        )
      : truncateAddress(item.data.sender, 4, 5);

  const to =
    item.type === "deposit"
      ? truncateAddress(decodeDepositRecipient(item.data.recipient), 4, 5)
      : truncateAddress(
          decodeWithdrawalRecipient(item.data.recipient, config),
          4,
          5,
        );

  const timestamp =
    item.type === "deposit"
      ? btcTx.data?.status.block_time
      : stacksTx.data?.burn_block_time;

  return (
    <View className="gap-2 mb-2">
      <View className="flex-row items-center gap-2">
        <DirectionIcon type={item.type} />
        <Text className="font-instrument-sans-medium text-sm text-primary">
          {formatAmount(item.data.amount)} {unit}
        </Text>
        <StatusBadge status={status} />
      </View>

      <View className="flex-row items-center pl-0.5">
        <Text className="font-instrument-sans-medium text-sm text-secondary">
          {from || "..."}
        </Text>
        <Text className="font-instrument-sans-medium text-sm text-secondary">
          {" "}
          →{" "}
        </Text>
        <Text className="font-instrument-sans-medium text-sm text-secondary">
          {to || "..."}
        </Text>
      </View>

      {timestamp ? (
        <Text className="font-matter-sq-mono text-xs text-sand-500">
          {formatTimestamp(timestamp)}
        </Text>
      ) : null}
    </View>
  );
}

function EmptyState() {
  return (
    <View className="items-center justify-center min-h-[106px]">
      <Text className="font-instrument-sans italic text-sm text-sand-500 dark:text-secondary">
        No activity in your account yet.
      </Text>
    </View>
  );
}

function SingleActivity({
  item,
  config,
}: {
  item: BridgeHistoryItem;
  config: SbtcBridgeConfig;
}) {
  const router = useRouter();
  return (
    <View className="gap-3">
      <Pressable onPress={() => router.push(getItemHref(item))}>
        <ActivityRow item={item} config={config} />
      </Pressable>
      <LinkUnderline
        size="xs"
        direction="right"
        onPress={() => router.push(getItemHref(item))}
      >
        Track activity
      </LinkUnderline>
    </View>
  );
}

function MultipleActivities({
  items,
  config,
}: {
  items: BridgeHistoryItem[];
  config: SbtcBridgeConfig;
}) {
  const router = useRouter();
  const preview = items.slice(0, 4);
  return (
    <View className="gap-3">
      {preview.map((item) => (
        <Pressable
          key={getItemKey(item)}
          onPress={() => router.push(getItemHref(item))}
        >
          <ActivityRow item={item} config={config} />
        </Pressable>
      ))}
      <LinkUnderline
        size="xs"
        direction="right"
        onPress={() => router.push("/Earn/sbtc-bridge/activity")}
      >
        See all activity
      </LinkUnderline>
    </View>
  );
}

// ─── Item card (for lists) ────────────────────────────────────────────────────

export function ActivityItemCard({
  item,
  config,
}: {
  item: BridgeHistoryItem;
  config: SbtcBridgeConfig;
}) {
  const router = useRouter();
  const href = getItemHref(item);
  return (
    <Pressable onPress={() => router.push(href)}>
      <View className="gap-3 rounded-[16px] border border-border-secondary bg-sand-100 px-4 py-4 dark:border-border-primary dark:bg-surface-primary">
        <ActivityRow item={item} config={config} />
        <LinkUnderline
          size="xs"
          direction="right"
          onPress={() => router.push(href)}
        >
          See details
        </LinkUnderline>
      </View>
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BridgeActivityCard({
  items,
  isLoading,
  config,
}: {
  items: BridgeHistoryItem[];
  isLoading: boolean;
  config: SbtcBridgeConfig;
}) {
  return (
    <View className="rounded-[16px] border border-border-secondary bg-sand-100 px-4 py-5 dark:border-border-primary dark:bg-surface-primary">
      {isLoading ? (
        <View className="items-center justify-center min-h-[72px]">
          <ActivityIndicator size="small" color="#B7B4B0" />
        </View>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : items.length === 1 ? (
        <SingleActivity item={items[0]} config={config} />
      ) : (
        <MultipleActivities items={items} config={config} />
      )}
    </View>
  );
}
