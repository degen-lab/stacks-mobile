import { useUserBalances } from "@/api/stacks/use-stacks-api";
import { mapApyStatus } from "@/features/dual-stacking/types/status";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { fromSatsToBtc, fromUstxToStx } from "@/lib/format/currency";
import { Loadable } from "../shared/loadable";
import {
  useAprConstants,
  useEnrollmentStatus,
} from "@/features/dual-stacking/hooks";
import { useAprComputation } from "@/features/dual-stacking/hooks/use-apr-computation";
import { divisorNetwork } from "@/lib/stacks/utils";
import { BalanceCard } from "../sbtc/balance-card";
import { BalanceCardSkeleton } from "../sbtc/balance-card.skeleton";
import { cardIcons } from "../shared/icons";
import { View } from "@/components/ui";
import { PositionCard } from "../defi/defi-position-card";
import { PositionCardSkeleton } from "../defi/defi-position-card.skeleton";
import { StackingCard } from "../stacking/stacking-card";
import { StackingCardSkeleton } from "../stacking/stacking-card.skeleton";
import { APYCardSkeleton } from "../apy/apy-card.skeleton";
import { APYCard } from "../apy/apy-card";

const TopSectionContainer = () => {
  const { stxAddress, isLoading: isWalletLoading } = useWalletAddresses();
  const {
    status,
    enrolledNextCycle,
    enrolledCurrentCycle,
    isLoading: isEnrollmentLoading,
    isError: isEnrollmentError,
  } = useEnrollmentStatus();
  const { maxAPR } = useAprConstants();
  const {
    expectedTotalApr,
    totalApr,
    stxStacked: stxStackedUstx,
    totalSbtcDefi: totalSbtcDefiSats,
    sbtcBalance: sbtcBalanceSats,
    isError,
    isLoading,
  } = useAprComputation();
  const {
    data: balances,
    isLoading: isBalancesLoading,
    isError: isBalancesError,
  } = useUserBalances({
    variables: { address: stxAddress ?? "" },
    enabled: !!stxAddress,
  });

  const sbtcBalance = fromSatsToBtc(sbtcBalanceSats);
  const totalSbtcInDefi = fromSatsToBtc(totalSbtcDefiSats) / divisorNetwork;
  const stxStacked = fromUstxToStx(stxStackedUstx);
  const stxBalance = balances ? fromUstxToStx(balances.stx.balance) : 0;
  const lockedBalance = balances ? fromUstxToStx(balances.stx.locked) : 0;
  const stxTotalBalance = stxStacked + (stxBalance - lockedBalance);

  const isSectionLoading =
    isWalletLoading || isLoading || isEnrollmentLoading || isBalancesLoading;
  const isSectionError = isError || isEnrollmentError || isBalancesError;
  const shouldCollapseCards = !isSectionLoading && Boolean(enrolledNextCycle);
  const displayApy =
    enrolledNextCycle && expectedTotalApr > 0
      ? expectedTotalApr
      : totalApr > 0
        ? totalApr
        : expectedTotalApr;
  const apyStatus = mapApyStatus({
    enrolledCurrentCycle,
    enrolledNextCycle,
    isStacking: stxStacked > 0,
    isDeFiParticipant: totalSbtcInDefi > 0,
    totalApr: displayApy,
    maxApr: maxAPR,
  });
  return (
    <View className="grid grid-cols-1 gap-2 min-[1420px]:grid-cols-4 lg:max-[1420px]:grid-cols-2 xl:gap-2">
      <Loadable
        isLoading={isSectionLoading}
        isError={isSectionError}
        errorFallback={<BalanceCardSkeleton />}
        fallback={<BalanceCardSkeleton />}
      >
        <BalanceCard
          title="sBTC in wallet"
          balance={sbtcBalance}
          currency="sBTC"
          icon={cardIcons.sbtcWallet}
          status={status}
          isCollapsible={shouldCollapseCards}
        />
      </Loadable>
      <Loadable
        fallback={<PositionCardSkeleton />}
        errorFallback={<PositionCardSkeleton />}
        isLoading={isSectionLoading}
        isError={isSectionError}
      >
        <PositionCard
          title="sBTC in DeFi"
          amount={totalSbtcInDefi}
          protocol={""}
          icon={cardIcons.sbtcDefi}
          isCollapsible={shouldCollapseCards}
        />
      </Loadable>
      <Loadable
        fallback={<StackingCardSkeleton />}
        errorFallback={<StackingCardSkeleton />}
        isLoading={isSectionLoading}
        isError={isSectionError}
      >
        <StackingCard
          title="STX Stacked"
          stxStacked={stxStacked}
          stxBalance={stxTotalBalance}
          icon={cardIcons.stx}
          isCollapsible={shouldCollapseCards}
        />
      </Loadable>
      <Loadable
        fallback={<APYCardSkeleton />}
        isLoading={isSectionLoading}
        isError={isSectionError}
        errorFallback={<APYCardSkeleton />}
      >
        <APYCard apy={displayApy} status={apyStatus} maxApy={maxAPR} />
      </Loadable>
    </View>
  );
};

export default TopSectionContainer;
