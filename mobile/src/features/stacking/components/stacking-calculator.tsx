import { useState, useEffect } from "react";
import { TextInput, Pressable, ScrollView } from "react-native";
import { View, Text, TokenAvatar, colors, Button } from "@/components/ui";
import GradientBorder from "@/components/ui/gradient-border";
import { SvgUri } from "react-native-svg";
import { useSvgAsset } from "@/hooks/use-svg-asset";
import { LinearGradient } from "expo-linear-gradient";
import { CustomPeriodModal } from "./custom-period-modal";
import type { StackingPosition } from "../types";

type Props = {
  availableBalance?: number;
  activePosition?: StackingPosition;
  calculate: (
    amount: number,
    cycles: number,
  ) => {
    daily: number;
    monthly: number;
    yearly: number;
  } | null;
  price: number;
  onUpdateChange?: (
    hasChanges: boolean,
    valid: boolean,
    newAmount?: number,
  ) => void;
};

const LOCK_PERIODS = [
  { label: "2 weeks", weeks: 2 },
  { label: "1 month", weeks: 4 },
  { label: "2 months", weeks: 8 },
  { label: "3 months", weeks: 12 },
  { label: "6 months", weeks: 24 },
  { label: "12 months", weeks: 52 },
  { label: "Custom", weeks: null },
];

export function StackingCalculator({
  availableBalance = 0,
  activePosition,
  calculate,
  price,
  onUpdateChange,
}: Props) {
  // Initialize state with active position if available, else defaults
  const [stxAmount, setStxAmount] = useState(
    activePosition ? String(activePosition.lockedAmount) : "40",
  );
  const [weeks, setWeeks] = useState(
    activePosition ? activePosition.lockDuration : 12,
  );
  const [isCustom, setIsCustom] = useState(false); // Could be derived if duration doesn't match presets

  const [showCustomModal, setShowCustomModal] = useState(false);

  const stacksCoinsUri = useSvgAsset(
    require("@/assets/images/stacks-coins.svg"),
  );

  useEffect(() => {
    if (activePosition?.lockedAmount) {
      setStxAmount(String(activePosition.lockedAmount));
    } else {
      setStxAmount("40");
    }
  }, [activePosition?.lockedAmount]);

  const inputAmount = Number(stxAmount) || 0;
  // Input now represents the total amount, not the delta
  const effectiveAmount = Math.max(0, inputAmount);

  // Notify parent component of changes
  useEffect(() => {
    if (!onUpdateChange) return;

    const newAmount = inputAmount;

    if (activePosition) {
      // User has active position - check for changes
      const hasChange = newAmount !== activePosition.lockedAmount;
      const isValid = newAmount >= activePosition.lockedAmount;
      onUpdateChange(hasChange, isValid, newAmount);
    } else {
      // User is stacking for the first time
      const hasChange = false; // No existing position to compare
      const isValid = newAmount >= 40;
      onUpdateChange(hasChange, isValid, newAmount);
    }
  }, [inputAmount, activePosition, onUpdateChange]);

  const cycles = weeks / 2;

  const results = calculate(effectiveAmount, cycles);
  const usdValue = effectiveAmount
    ? (effectiveAmount * price).toFixed(2)
    : "0.00";
  const totalEarningsStx = results ? results.daily * (weeks * 7) : 0;
  const totalEarningsUsd = totalEarningsStx * price;

  // Current Earnings (for comparison over the same selected period)
  const currentResults = activePosition
    ? calculate(activePosition.lockedAmount, weeks / 2)
    : null;
  const currentTotalEarningsStx =
    currentResults && activePosition ? currentResults.daily * (weeks * 7) : 0;
  const currentTotalEarningsUsd = currentTotalEarningsStx * price;

  const earningsDeltaUsd = totalEarningsUsd - currentTotalEarningsUsd;
  const maxStackingAmount = activePosition
    ? activePosition.lockedAmount + availableBalance
    : availableBalance;
  const availableLabel = activePosition ? "Available to add" : "Available";

  const handleMax = () => {
    setStxAmount(maxStackingAmount.toFixed(2));
  };

  const handlePeriodSelect = (period: (typeof LOCK_PERIODS)[number]) => {
    if (period.weeks === null) {
      setShowCustomModal(true);
    } else {
      setIsCustom(false);
      setWeeks(period.weeks);
    }
  };

  const handleApplyCustomPeriod = (weeksValue: number) => {
    setWeeks(weeksValue);
    setIsCustom(true);
  };

  const getCustomLabel = () => {
    if (!isCustom) return null;
    if (weeks < 8) return `${weeks} weeks`;
    if (weeks < 48) return `${Math.round(weeks / 4)} months`;
    return `${Math.round(weeks / 52)} ${weeks >= 104 ? "years" : "year"}`;
  };

  return (
    <View>
      {/* Amount Input */}
      <View className="mb-3">
        <Text className="font-matter text-xl text-primary">
          {activePosition
            ? inputAmount === activePosition.lockedAmount
              ? "Your stacking amount"
              : "New stacking amount"
            : "Stacking amount"}
        </Text>
      </View>
      <View className="mb-4 rounded-2xl border border-surface-secondary bg-sand-100 p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1 flex-row items-center gap-2">
            <TokenAvatar symbol="STX" size={32} />
            <TextInput
              className="flex-1 border-0 bg-transparent p-0 text-3xl leading-9 dark:text-white font-matter"
              placeholder="0"
              keyboardType="numeric"
              value={stxAmount}
              onChangeText={setStxAmount}
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
          <Button
            onPress={handleMax}
            variant="outline"
            size="sm"
            label="Max"
            className="rounded-full border border-sand-300 bg-sand-100 px-3 py-1.5"
            textClassName="text-xs font-instrument-sans-medium text-primary"
          />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-instrument-sans text-secondary">
            ≈ ${usdValue}
          </Text>
          <Text className="text-sm font-instrument-sans text-secondary">
            {availableLabel}: {availableBalance.toFixed(2)} STX
          </Text>
        </View>
      </View>

      <View className="mb-5">
        <Text className="mb-3 font-matter text-xl text-primary">
          Preview period
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
          contentContainerClassName="gap-2"
        >
          {LOCK_PERIODS.map((period, index) => {
            const isSelected =
              period.weeks === null
                ? isCustom
                : !isCustom && weeks === period.weeks;
            const displayLabel =
              isSelected && isCustom && period.weeks === null
                ? getCustomLabel()
                : period.label;
            return (
              <Pressable
                key={index}
                onPress={() => handlePeriodSelect(period)}
                className={`rounded-full px-4 py-2 border ${
                  isSelected
                    ? "border-sand-600 bg-sand-900"
                    : "border-sand-300 bg-sand-100"
                }`}
              >
                <Text
                  className={`text-sm font-instrument-sans-medium ${isSelected ? "text-white" : "text-primary"}`}
                >
                  {displayLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <GradientBorder
        borderRadius={16}
        borderBottomRightRadius={32}
        gradient={colors.stacks.gameCardStroke}
        innerBackground={colors.neutral[100]}
        angle={85}
        hasShadow={false}
      >
        <View
          className="p-6"
          style={{
            overflow: "hidden",
            borderRadius: 16,
            borderBottomRightRadius: 32,
          }}
        >
          <LinearGradient
            colors={colors.stacks.gameCardFillRight}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 0.7 }}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: 0,
              width: "100%",
              borderRadius: 16,
              borderBottomRightRadius: 20,
              opacity: 1,
            }}
          />

          {stacksCoinsUri && (
            <View
              style={{
                position: "absolute",
                bottom: -13,
                right: -5,
                zIndex: 10,
                opacity: results && Number(stxAmount) >= 40 ? 1 : 0.3,
              }}
            >
              <SvgUri uri={stacksCoinsUri} width={170} height={90} />
            </View>
          )}

          {results && Number(stxAmount) >= 40 ? (
            <View>
              <View className="mb-2 flex-row items-center gap-2">
                <Text className="text-sm font-instrument-sans text-secondary">
                  Estimated Earnings
                </Text>
                <View className="rounded-full bg-sand-200/80 px-2 py-1">
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-sm font-instrument-sans-semibold text-secondary">
                      ${totalEarningsUsd.toFixed(2)}
                    </Text>
                    {activePosition && earningsDeltaUsd !== 0 && (
                      <Text
                        className={`text-sm font-instrument-sans-semibold ${earningsDeltaUsd > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        ({earningsDeltaUsd > 0 ? "+" : "-"}$
                        {Math.abs(earningsDeltaUsd).toFixed(2)})
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <View className="flex-row flex-wrap items-baseline gap-2">
                <Text className="font-matter text-3xl text-primary">
                  {totalEarningsStx.toFixed(2)} STX
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <View className="mb-2 flex-row items-center gap-2 opacity-60">
                <Text className="text-sm font-instrument-sans text-secondary">
                  Estimated Earnings
                </Text>
                <View className="rounded-full bg-sand-200/60 px-2 py-1">
                  <Text className="text-sm font-instrument-sans-semibold text-secondary">
                    $0.00
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap items-baseline gap-2">
                <Text
                  className="font-matter text-3xl text-secondary"
                  style={{ opacity: 0.6 }}
                >
                  0.00 STX
                </Text>
              </View>
            </View>
          )}
        </View>
      </GradientBorder>

      <CustomPeriodModal
        visible={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onApply={handleApplyCustomPeriod}
      />
    </View>
  );
}
