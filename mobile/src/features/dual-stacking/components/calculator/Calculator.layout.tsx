import { useCallback, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";

import Section from "@/features/dual-stacking/components/layout/Section";
import { ValueSlider } from "@/components/ui/slider-value";
import { View } from "@/components/ui";
import {
  CircleThreePlusFilled,
  DollarIcon,
  SbtcIcon,
  StacksIcon,
} from "@/components/ui/icons";
import { formatDecimal, sanitizeDecimal } from "@/lib/format/decimal";
import { Toggle } from "@/components/ui/toggle";
import { ProjectRewardsInput } from "./Input";
import { ProjectRewardsResult } from "./Result";
import {
  fromBtcToSats,
  fromSatsToBtc,
  fromStxToUstx,
  fromUstxToStx,
} from "@/lib/format/currency";

type CalculatorLayoutProps = {
  sbtcWalletInput: string;
  stxInput: string;
  handleSbtcWalletChange: (value: string) => void;
  handleStxChange: (value: string) => void;
  stxAmount: number;
  handleSliderChange: (value: number) => void;
  isLoadingBalances: boolean;
  isLoadingResults: boolean;
  isRewardsError: boolean;
  rewardsSbtc?: number;
  rewardsUsd?: number;
  stxErrorText?: string;
  sliderMax: number;
  isCalculatingGoldenRatio?: boolean;
  isStxLocked?: boolean;
  totalApr: number;
  isUserEnrolledNextCycle?: boolean;
  btcUsdPrice?: number;
  stxUsdPrice?: number;
};

export function CalculatorLayout({
  sbtcWalletInput,
  stxInput,
  handleSbtcWalletChange,
  handleStxChange,
  stxAmount,
  handleSliderChange,
  isLoadingBalances,
  isLoadingResults,
  isRewardsError,
  rewardsSbtc,
  rewardsUsd,
  stxErrorText,
  sliderMax,
  isCalculatingGoldenRatio = false,
  isStxLocked = false,
  isUserEnrolledNextCycle = false,
  totalApr,
  btcUsdPrice = 0,
  stxUsdPrice = 0,
}: CalculatorLayoutProps) {
  const [sbtcDisplayUsd, setSbtcDisplayUsd] = useState(false);
  const [stxDisplayUsd, setStxDisplayUsd] = useState(false);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const sbtcDisplayValue = useMemo(() => {
    if (!sbtcDisplayUsd || !Number.isFinite(btcUsdPrice) || btcUsdPrice <= 0) {
      return sbtcWalletInput;
    }

    const numeric = Number(sbtcWalletInput);
    return Number.isFinite(numeric)
      ? (numeric * btcUsdPrice).toFixed(2)
      : sbtcWalletInput;
  }, [btcUsdPrice, sbtcDisplayUsd, sbtcWalletInput]);

  const stxDisplayValue = useMemo(() => {
    if (!stxDisplayUsd || !Number.isFinite(stxUsdPrice) || stxUsdPrice <= 0) {
      return stxInput;
    }

    const numeric = Number(stxInput);
    return Number.isFinite(numeric)
      ? (numeric * stxUsdPrice).toFixed(2)
      : stxInput;
  }, [stxDisplayUsd, stxInput, stxUsdPrice]);

  const handleSbtcDisplayChange = useCallback(
    (value: string) => {
      if (value === "") {
        handleSbtcWalletChange("");
        return;
      }

      if (sbtcDisplayUsd && Number.isFinite(btcUsdPrice) && btcUsdPrice > 0) {
        const usdValue = Number(value);
        if (!Number.isFinite(usdValue)) return;
        const cryptoValue = usdValue / btcUsdPrice;
        const normalizedValue = fromSatsToBtc(fromBtcToSats(cryptoValue));
        handleSbtcWalletChange(formatDecimal(normalizedValue, 8));
        return;
      }

      handleSbtcWalletChange(sanitizeDecimal(value, 8));
    },
    [btcUsdPrice, handleSbtcWalletChange, sbtcDisplayUsd],
  );

  const handleStxDisplayChange = useCallback(
    (value: string) => {
      if (value === "") {
        handleStxChange("");
        return;
      }

      if (stxDisplayUsd && Number.isFinite(stxUsdPrice) && stxUsdPrice > 0) {
        const usdValue = Number(value);
        if (!Number.isFinite(usdValue)) return;
        const cryptoValue = usdValue / stxUsdPrice;
        const normalizedValue = fromUstxToStx(
          Math.round(fromStxToUstx(cryptoValue)),
        );
        handleStxChange(formatDecimal(normalizedValue, 6));
        return;
      }

      handleStxChange(sanitizeDecimal(value, 6));
    },
    [handleStxChange, stxDisplayUsd, stxUsdPrice],
  );

  return (
    <Section
      icon={<CircleThreePlusFilled width={17} height={17} />}
      title="Dual Stacking calculator"
    >
      <View
        className="gap-6 rounded-xl bg-surface-primary px-5"
        style={{ paddingVertical: isUserEnrolledNextCycle ? 32 : 75 }}
      >
        <View className={isWide ? "flex-row gap-3" : "gap-3"}>
          <ProjectRewardsInput
            label="sBTC in Wallet"
            icon={
              sbtcDisplayUsd ? (
                <DollarIcon width={12} height={12} />
              ) : (
                <SbtcIcon width={15} height={15} />
              )
            }
            variant="sbtc-icon"
            value={sbtcDisplayValue}
            onChange={handleSbtcDisplayChange}
            placeholder={sbtcDisplayUsd ? "0.00" : "0.00000000"}
            disabled={isLoadingBalances}
            maxDecimals={sbtcDisplayUsd ? 2 : 8}
            headerRight={
              <Toggle
                value={sbtcDisplayUsd ? "usd" : "crypto"}
                options={[
                  { value: "crypto", label: "sBTC" },
                  { value: "usd", label: "USD" },
                ]}
                onChange={(unit) => setSbtcDisplayUsd(unit === "usd")}
              />
            }
          />

          <ProjectRewardsInput
            label="STX Stacked"
            icon={
              stxDisplayUsd ? (
                <DollarIcon width={12} height={12} />
              ) : (
                <StacksIcon width={12} height={12} />
              )
            }
            variant="stx-icon"
            value={stxDisplayValue}
            onChange={handleStxDisplayChange}
            placeholder={stxDisplayUsd ? "0.00" : "0"}
            errorText={stxErrorText}
            disabled={isStxLocked}
            maxDecimals={stxDisplayUsd ? 2 : 6}
            headerRight={
              <Toggle
                value={stxDisplayUsd ? "usd" : "crypto"}
                options={[
                  { value: "crypto", label: "STX" },
                  { value: "usd", label: "USD" },
                ]}
                onChange={(unit) => setStxDisplayUsd(unit === "usd")}
              />
            }
          />
        </View>

        <View className="px-4">
          <ValueSlider
            min={0}
            max={sliderMax}
            value={stxAmount}
            onChange={handleSliderChange}
            currencySymbol={<StacksIcon width={12} height={12} />}
            showTicks={true}
            disabled={isStxLocked}
            loading={isCalculatingGoldenRatio}
          />
        </View>

        <ProjectRewardsResult
          totalApr={totalApr}
          rewardsSbtc={rewardsSbtc}
          rewardsUsd={rewardsUsd}
          isLoading={isLoadingResults || isLoadingBalances}
          isError={isRewardsError}
        />
      </View>
    </Section>
  );
}
