export const avg = (arr?: number[] | null) =>
  !arr || arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

/**
 * Maps a yield cycle to its corresponding PoX cycle.
 *
 * Rule: Current yield + previous yield both use (currentPoX - 1) because
 * the current PoX cycle's rewards aren't finalized yet. Each earlier yield
 * gets its own decremented PoX cycle.
 *
 * @example
 * // If currentYield=10, currentPoX=116:
 * poxForYield(10, 10, 116) // 115
 * poxForYield(9, 10, 116)  // 115 (reuses same data)
 * poxForYield(8, 10, 116)  // 114
 * poxForYield(7, 10, 116)  // 113
 */
export const poxForYield = (
  yieldCycle: number,
  currentYield: number,
  currentPox: number,
): number | undefined => {
  if (yieldCycle == null || currentYield == null || currentPox == null) {
    console.log("poxForYield: Missing required parameters", {
      yieldCycle,
      currentYield,
      currentPox,
    });
    return undefined;
  }

  const stepsBack = currentYield - yieldCycle;
  return currentPox - Math.max(1, stepsBack);
};

export const rewardsCompositionPercentages = (
  sbtcHoldings: number,
  defiHoldings: number,
  stxAverageHoldings: number,
  baseApr: number,
  maxApr: number,
  projectRewardsApr: number,
  stackingApr: number,
  btcPrice: number,
  stxPrice: number,
): Record<string, string> => {
  const baseRewards =
    (((sbtcHoldings + defiHoldings) * baseApr) / 100) * btcPrice;
  const boostedRewards =
    ((sbtcHoldings * (projectRewardsApr - baseApr) +
      defiHoldings * (maxApr - baseApr)) /
      100) *
    btcPrice;
  const stackingRewards = ((stxAverageHoldings * stackingApr) / 100) * stxPrice;

  const totalRewards = baseRewards + boostedRewards + stackingRewards;

  if (!isFinite(totalRewards) || totalRewards === 0) {
    return { base: "0.00", boosted: "0.00", stacking: "0.00" };
  }

  const baseRewardsPercentageOutOfTotalRewards = (
    (baseRewards / totalRewards) *
    100
  ).toFixed(2);
  const boostedRewardsPercentageOutOfTotalRewards = (
    (boostedRewards / totalRewards) *
    100
  ).toFixed(2);
  const stackingRewardsPercentageOutOfTotalRewards = (
    100 -
    Number(baseRewardsPercentageOutOfTotalRewards) -
    Number(boostedRewardsPercentageOutOfTotalRewards)
  ).toFixed(2);

  return {
    base: baseRewardsPercentageOutOfTotalRewards,
    boosted: boostedRewardsPercentageOutOfTotalRewards,
    stacking: stackingRewardsPercentageOutOfTotalRewards,
  };
};

export const isPositiveNumber = (value: number): boolean =>
  Number.isFinite(value) && value > 0;
