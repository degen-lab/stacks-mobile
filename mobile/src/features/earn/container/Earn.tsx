import { useMemo, useState } from "react";

import { usePortfolioBalance } from "@/hooks/use-portfolio-balance";
import formatCurrency from "@/lib/format/currency";
import { useEarnActions } from "../hooks/use-earn-actions";

import EarnLayout from "./Earn.layout";

export default function EarnScreen() {
  const actions = useEarnActions();
  const { usdBalance } = usePortfolioBalance();
  const [activeTab, setActiveTab] = useState("defi");

  const formattedBalance = useMemo(() => {
    const { dollars, cents } = formatCurrency(usdBalance);
    return `${dollars}${cents}`;
  }, [usdBalance]);
  const totalEarnings = 0;

  return (
    <EarnLayout
      totalBalance={formattedBalance}
      totalEarnings={totalEarnings}
      actions={actions}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
