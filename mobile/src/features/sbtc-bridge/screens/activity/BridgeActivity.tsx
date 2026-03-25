import { useMemo, useState } from "react";

import { useBridgeHistoryData } from "../../hooks/use-bridge-data";
import { BridgeActivityLayout } from "./BridgeActivity.layout";

type FilterTab = "all" | "deposit" | "withdrawal";

export function BridgeActivityScreen() {
  const [tab, setTab] = useState<FilterTab>("all");
  const { config, items, deposits, localDeposits, withdrawals } =
    useBridgeHistoryData();

  const isLoading =
    deposits.isLoading || localDeposits.isLoading || withdrawals.isLoading;

  const filteredItems = useMemo(() => {
    if (tab === "deposit") return items.filter((i) => i.type === "deposit");
    if (tab === "withdrawal")
      return items.filter((i) => i.type === "withdrawal");
    return items;
  }, [items, tab]);

  return (
    <BridgeActivityLayout
      tab={tab}
      onTabChange={setTab}
      items={filteredItems}
      config={config}
      isLoading={isLoading}
    />
  );
}
