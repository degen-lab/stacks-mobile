import { useEffect, useMemo, useRef, useState } from "react";

import { useProjectRewards } from "@/api/dual-stacking";
import {
  useNrCyclesYear,
  useSbtcInWallet,
  useUserStackingDefiBalances,
} from "@/api/dual-stacking/contract";
import { useWalletAddresses } from "@/hooks/use-wallet-addresses";
import { useDebounce } from "@/hooks/use-debounce";
import {
  fromBtcToSats,
  fromSatsToBtc,
  fromStxToUstx,
  fromUstxToStx,
} from "@/lib/format/currency";
import { principalArgFromAddress } from "@/lib/stacks/addresses";
import {
  useAprConstants,
  useEnrollmentStatus,
} from "@/features/dual-stacking/hooks";
import { useCoinPricesForYield } from "@/features/dual-stacking/hooks/use-coin-prices-for-yield";
import { formatDecimal, sanitizeDecimal } from "@/lib/format/decimal";
import { CalculatorLayout } from "./Calculator.layout";
import { computeBlendedApr } from "../../utils/apr-calculations";

const CYCLES_PER_YEAR = 26;
const DEFAULT_SLIDER_MAX = 100_000;
const DEFAULT_STX_AMOUNT = 10_000;
const MIN_SBTC_AMOUNT = 0.0001;
const MIN_STX_AMOUNT = 1;
const SBTC_DEBOUNCE_MS = 400;
const STX_DEBOUNCE_MS = 200;

const DEFAULT_PREVIEW_ADDRESS = "SP3ZAEA3P8QA989G12XS28PMJ2Y06DR4KCQRZRY8T";

export default function Calculator() {
  const { stxAddress } = useWalletAddresses();
  const userAddress = stxAddress ?? DEFAULT_PREVIEW_ADDRESS;
  const principalArg = principalArgFromAddress(userAddress);
  const balancesHydrated = useRef(false);

  const { enrolledNextCycle } = useEnrollmentStatus();
  const { baseAPR, projectRewardsMaxApr } = useAprConstants();
  const { data: coinPricesNormalized } = useCoinPricesForYield();
  const { data: sbtcBalanceSats, isLoading: isSbtcLoading } =
    useSbtcInWallet(principalArg);
  const { data: stackingDefiBalances, isLoading: isStackingDefiLoading } =
    useUserStackingDefiBalances(principalArg);
  const stxStackedUstx = stackingDefiBalances?.stxStackedUstx;
  const totalSbtcInDefi = stackingDefiBalances?.totalDefiSats;
  const { data: nrCyclesYear = CYCLES_PER_YEAR } = useNrCyclesYear();

  const [sbtcWalletInput, setSbtcWalletInput] = useState("0");
  const [stxInput, setStxInput] = useState("0");
  const [userHasEditedStx, setUserHasEditedStx] = useState(false);

  const latestBtcUsdPrice = Number(coinPricesNormalized?.btc_price ?? 0);
  const latestStxUsdPrice = Number(coinPricesNormalized?.stx_price ?? 0);

  useEffect(() => {
    balancesHydrated.current = false;
    setUserHasEditedStx(false);
    setSbtcWalletInput("0");
    setStxInput("0");
  }, [userAddress]);

  useEffect(() => {
    if (
      balancesHydrated.current ||
      sbtcBalanceSats === undefined ||
      stxStackedUstx === undefined
    ) {
      return;
    }

    const btcAmount = fromSatsToBtc(Number(sbtcBalanceSats));
    const initialSbtc = btcAmount > 0 ? btcAmount : MIN_SBTC_AMOUNT;
    const stxAmount = fromUstxToStx(Number(stxStackedUstx));
    const initialStx =
      stxAmount > 0 ? Math.round(stxAmount) : DEFAULT_STX_AMOUNT;

    setSbtcWalletInput(formatDecimal(initialSbtc, 8));
    setStxInput(String(initialStx));
    balancesHydrated.current = true;
  }, [sbtcBalanceSats, stxStackedUstx]);

  const sbtcWalletLive = useMemo(() => {
    const numeric = Number(sbtcWalletInput);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
  }, [sbtcWalletInput]);

  const stxLive = useMemo(() => {
    const numeric = Number(stxInput);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
  }, [stxInput]);

  const committedSbtcWallet = useDebounce(sbtcWalletLive, SBTC_DEBOUNCE_MS);
  const committedStx = useDebounce(stxLive, STX_DEBOUNCE_MS);
  const committedTotalSbtc = committedSbtcWallet;
  const committedSbtcWalletInSats = fromBtcToSats(committedSbtcWallet);

  const tooLowStx = committedStx > 0 && committedStx < MIN_STX_AMOUNT;
  const stxErrorText = tooLowStx
    ? `Min. ${MIN_STX_AMOUNT} STX required`
    : undefined;

  const canQueryRewards = Boolean(
    userAddress &&
    !tooLowStx &&
    committedTotalSbtc > 0 &&
    committedStx >= MIN_STX_AMOUNT,
  );

  const rewardsParams = useMemo(
    () => ({
      address: userAddress,
      maxApr: projectRewardsMaxApr,
      sbtcWallet: committedSbtcWalletInSats,
      sbtcDefi: Number(totalSbtcInDefi ?? 0),
      stx: Math.round(fromStxToUstx(committedStx)),
    }),
    [
      committedSbtcWalletInSats,
      committedStx,
      projectRewardsMaxApr,
      totalSbtcInDefi,
      userAddress,
    ],
  );

  const {
    data: rewardsData,
    isLoading: isRewardsLoading,
    isFetching: isRewardsFetching,
    isError: isRewardsError,
  } = useProjectRewards({
    variables: rewardsParams,
    enabled: canQueryRewards,
  });

  useEffect(() => {
    if (userHasEditedStx) return;
    if (!latestBtcUsdPrice || !latestStxUsdPrice) return;
    if (sbtcWalletLive <= 0) return;

    const sbtcUsdValue = sbtcWalletLive * latestBtcUsdPrice;
    const equivalentStx = sbtcUsdValue / latestStxUsdPrice;
    const suggestedStx = Math.max(equivalentStx, MIN_STX_AMOUNT);

    setStxInput(formatDecimal(suggestedStx, 6));
  }, [latestBtcUsdPrice, latestStxUsdPrice, sbtcWalletLive, userHasEditedStx]);

  const { annualRewardsBtc, annualRewardsUsd, totalApr } = useMemo(() => {
    if (committedStx === 0) {
      const effectiveBaseAPR = Number(rewardsData?.baseAPR ?? baseAPR);
      const sbtcUsdValue = committedTotalSbtc * latestBtcUsdPrice;
      const annualRewardsUsdFromApr = sbtcUsdValue * (effectiveBaseAPR / 100);
      const annualRewardsBtcFromApr = latestBtcUsdPrice
        ? annualRewardsUsdFromApr / latestBtcUsdPrice
        : 0;

      return {
        annualRewardsBtc: annualRewardsBtcFromApr,
        annualRewardsUsd: annualRewardsUsdFromApr,
        totalApr: effectiveBaseAPR,
      };
    }

    if (
      !rewardsData ||
      !latestBtcUsdPrice ||
      !latestStxUsdPrice ||
      !nrCyclesYear
    ) {
      return {
        annualRewardsBtc: 0,
        annualRewardsUsd: 0,
        totalApr: 0,
      };
    }

    const rewardsPerCycleSats = Number(rewardsData.expectedUserRewards ?? 0);
    const annualRewardsSats = rewardsPerCycleSats * nrCyclesYear;
    const annualSbtcBtc = fromSatsToBtc(annualRewardsSats);
    const annualSbtcUsd = annualSbtcBtc * latestBtcUsdPrice;
    const sbtcUsdValue = committedTotalSbtc * latestBtcUsdPrice;
    const stxUsdValue = committedStx * latestStxUsdPrice;
    const stackingApr = Number(coinPricesNormalized?.stacking_apr ?? 0);
    const annualStxRewardsUsd = stxUsdValue * (stackingApr / 100);
    const annualStxRewardsBtc = latestBtcUsdPrice
      ? annualStxRewardsUsd / latestBtcUsdPrice
      : 0;
    const sbtcAprValue = Number(rewardsData.expectedAPR ?? 0);

    return {
      annualRewardsBtc: annualSbtcBtc + annualStxRewardsBtc,
      annualRewardsUsd: annualSbtcUsd + annualStxRewardsUsd,
      totalApr: computeBlendedApr(
        sbtcUsdValue,
        sbtcAprValue,
        stxUsdValue,
        stackingApr,
      ),
    };
  }, [
    baseAPR,
    coinPricesNormalized?.stacking_apr,
    committedStx,
    committedTotalSbtc,
    latestBtcUsdPrice,
    latestStxUsdPrice,
    nrCyclesYear,
    rewardsData,
  ]);

  const sliderMax = useMemo(() => {
    if (!latestBtcUsdPrice || !latestStxUsdPrice || committedTotalSbtc <= 0) {
      return DEFAULT_SLIDER_MAX;
    }

    const sbtcUsdValue = committedTotalSbtc * latestBtcUsdPrice;
    return Math.ceil(sbtcUsdValue / latestStxUsdPrice);
  }, [committedTotalSbtc, latestBtcUsdPrice, latestStxUsdPrice]);

  const isLoadingBalances = isSbtcLoading || isStackingDefiLoading;
  const isLoadingResults = isRewardsLoading || isRewardsFetching;

  const handleSbtcWalletChange = (value: string) => {
    setSbtcWalletInput(sanitizeDecimal(value, 8));
    setUserHasEditedStx(false);
  };

  const handleStxChange = (value: string) => {
    setStxInput(sanitizeDecimal(value, 6));
    setUserHasEditedStx(true);
  };

  const handleSliderChange = (value: number) => {
    const clamped = Math.max(
      MIN_STX_AMOUNT,
      Math.min(sliderMax, Math.round(value)),
    );
    setStxInput(String(clamped));
    setUserHasEditedStx(true);
  };

  return (
    <CalculatorLayout
      sbtcWalletInput={sbtcWalletInput}
      stxInput={stxInput}
      handleSbtcWalletChange={handleSbtcWalletChange}
      handleStxChange={handleStxChange}
      stxAmount={stxLive}
      handleSliderChange={handleSliderChange}
      sliderMax={sliderMax}
      stxErrorText={stxErrorText}
      isLoadingBalances={isLoadingBalances}
      isLoadingResults={isLoadingResults}
      isRewardsError={isRewardsError}
      rewardsSbtc={annualRewardsBtc}
      rewardsUsd={annualRewardsUsd}
      totalApr={totalApr}
      isUserEnrolledNextCycle={enrolledNextCycle}
      btcUsdPrice={latestBtcUsdPrice}
      stxUsdPrice={latestStxUsdPrice}
    />
  );
}
