import { useMemo, useState } from "react";

import { useStacksPrice } from "@/api/market/use-stacks-price";
import { useStxBalance } from "@/hooks/use-stx-balance";
import { useActiveAccountIndex } from "@/lib/store/settings";
import formatCurrency from "@/lib/format/currency";
import { useEarnActions } from "../hooks/use-earn-actions";
import { ReceiveSheet } from "../components/receive-sheet";
import { BridgeSheet } from "../components/bridge-sheet";

import EarnLayout from "./Earn.layout";

export default function EarnScreen() {
  const { activeAccountIndex } = useActiveAccountIndex();
  const { balance: stxBalance } = useStxBalance(activeAccountIndex);
  const { data: stxPriceUsd } = useStacksPrice();

  const actions = useEarnActions();
  const [activeTab, setActiveTab] = useState("defi");

  const totalBalanceUsd = useMemo(() => {
    if (stxPriceUsd === null || stxPriceUsd === undefined) return null;
    return stxBalance * stxPriceUsd;
  }, [stxBalance, stxPriceUsd]);

  const formattedBalance = useMemo(() => {
    if (totalBalanceUsd === null) return null;
    const { dollars, cents } = formatCurrency(totalBalanceUsd);
    return `${dollars}${cents}`;
  }, [totalBalanceUsd]);
  // Hide in-game points here; show $0 until real earnings data is available
  const totalEarnings = 0;

  return (
    <>
      <EarnLayout
        totalBalance={formattedBalance}
        totalEarnings={totalEarnings}
        actions={actions}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ReceiveSheet
        open={actions.receiveSheetOpen}
        onClose={() => actions.setReceiveSheetOpen(false)}
      />
      <BridgeSheet
        open={actions.bridgeSheetOpen}
        onClose={() => actions.setBridgeSheetOpen(false)}
      />
    </>
  );
}
