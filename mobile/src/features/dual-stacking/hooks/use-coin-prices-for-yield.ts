import { useMemo } from "react";
import { useDualStackingDataWithLatestCycle } from "./use-dual-stacking-data";
import { isPositiveNumber, poxForYield } from "../utils/apr-calculations";
import { CoinPricesResponse, useCoinPrices } from "@/api/dual-stacking";
import { usePoxData } from "@/api/stacks/use-stacks-api";

const UNINITIALIZED_CONTRACT_STACKING_APR = 8.5;

export const useCoinPricesForYield = (yieldCycle?: number) => {
  const { data: poxData } = usePoxData();
  const { cycle: currentYield } = useDualStackingDataWithLatestCycle();
  const targetYield = yieldCycle ?? currentYield;

  const poxCycleId = useMemo(() => {
    if (
      poxData?.current_cycle?.id == null ||
      currentYield == null ||
      targetYield == null
    ) {
      return undefined;
    }

    const currentPox = poxData.current_cycle.id;
    return poxForYield(targetYield, currentYield, currentPox);
  }, [poxData, currentYield, targetYield]);

  const shouldFetch = targetYield != null && poxCycleId != null;

  const coinPricesQuery = useCoinPrices({
    variables: {
      yieldCycleId: isPositiveNumber(Number(targetYield) - 1)
        ? Number(targetYield) - 1
        : 0,
      poxCycleId: isPositiveNumber(Number(poxCycleId) - 1)
        ? Number(poxCycleId) - 1
        : 0,
    },
    enabled: shouldFetch,
  });

  const normalizedData = useMemo(() => {
    const raw = coinPricesQuery.data as CoinPricesResponse | undefined;
    if (!raw) return undefined;

    const priceRow =
      raw.prices?.find((p) => p.yield_cycle_id === targetYield) ||
      raw.prices?.sort((a, b) => b.yield_cycle_id - a.yield_cycle_id)[0];

    const aprRow =
      raw.aprs?.find((a) => a.pox_cycle === poxCycleId) ||
      raw.aprs?.sort((a, b) => b.pox_cycle - a.pox_cycle)[0];

    const effectivePrices = priceRow ?? raw.latest_prices;

    if (!effectivePrices && !aprRow) return undefined;

    return {
      stx_price: effectivePrices?.stx_price
        ? parseFloat(effectivePrices.stx_price)
        : undefined,
      btc_price: effectivePrices?.btc_price
        ? parseFloat(effectivePrices.btc_price)
        : undefined,
      stacking_apr: aprRow?.stacking_apr
        ? parseFloat(aprRow.stacking_apr)
        : UNINITIALIZED_CONTRACT_STACKING_APR,
    };
  }, [coinPricesQuery.data, targetYield, poxCycleId]);

  return {
    ...coinPricesQuery,
    data: normalizedData,
    raw: coinPricesQuery.data as CoinPricesResponse,
    isLoading: coinPricesQuery.isLoading && coinPricesQuery.isFetching,
    isError: coinPricesQuery.isError,
    meta: {
      targetYield,
      currentYield,
      currentPox: poxData?.current_cycle?.id,
      calculatedPox: poxCycleId,
      shouldFetch,
    },
  };
};
