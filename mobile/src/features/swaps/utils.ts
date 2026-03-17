import type {
  SerializedPostCondition,
  SwapContractCallParams,
  SwapToken,
} from "@/api/defi";
import type { SwapAsset } from "./types";

export const STX_TOKEN_ID = "token-stx";
export const SBTC_TOKEN_ID = "token-sbtc";

export function baseUnitsToDisplayString(
  value: string | number | bigint | null | undefined,
  decimals: number,
  maxFractionDigits = Math.min(decimals, 8),
) {
  if (value == null) return "0";

  const normalized = String(value).trim();
  if (!normalized) return "0";

  const sign = normalized.startsWith("-") ? "-" : "";
  const digits = sign ? normalized.slice(1) : normalized;
  const padded =
    decimals > 0 ? digits.padStart(decimals + 1, "0") : digits || "0";
  const integerPart =
    decimals > 0 ? padded.slice(0, -decimals) || "0" : padded || "0";
  const fractionPart = decimals > 0 ? padded.slice(-decimals) : "";
  const trimmedFraction = fractionPart
    .slice(0, maxFractionDigits)
    .replace(/0+$/, "");

  return trimmedFraction
    ? `${sign}${integerPart}.${trimmedFraction}`
    : `${sign}${integerPart}`;
}

export function displayAmountToBaseUnits(
  input: string,
  decimals: number,
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const [wholePartRaw = "0", fractionRaw = ""] = trimmed.split(".");
  const wholePart = wholePartRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionRaw.slice(0, decimals).padEnd(decimals, "0");
  const combined = `${wholePart}${fraction}`.replace(/^0+(?=\d)/, "");

  return combined || "0";
}

export function compareBaseUnitAmounts(left: string, right: string) {
  const leftValue = BigInt(left || "0");
  const rightValue = BigInt(right || "0");

  if (leftValue === rightValue) return 0;
  return leftValue > rightValue ? 1 : -1;
}

export function sortSwapAssets(left: SwapAsset, right: SwapAsset) {
  if (left.hasBalance !== right.hasBalance) {
    return left.hasBalance ? -1 : 1;
  }

  if (left.tokenId === STX_TOKEN_ID && right.tokenId !== STX_TOKEN_ID)
    return -1;
  if (right.tokenId === STX_TOKEN_ID && left.tokenId !== STX_TOKEN_ID) return 1;
  if (left.tokenId === SBTC_TOKEN_ID && right.tokenId !== SBTC_TOKEN_ID)
    return -1;
  if (right.tokenId === SBTC_TOKEN_ID && left.tokenId !== SBTC_TOKEN_ID)
    return 1;

  const leftUsd = Number(left.balanceDisplay || "0") * (left.usdPrice ?? 0);
  const rightUsd = Number(right.balanceDisplay || "0") * (right.usdPrice ?? 0);

  if (leftUsd !== rightUsd) {
    return rightUsd - leftUsd;
  }

  if (left.hasBalance && right.hasBalance) {
    return compareBaseUnitAmounts(
      right.balanceBaseUnits,
      left.balanceBaseUnits,
    );
  }

  return left.symbol.localeCompare(right.symbol);
}

export function getDefaultSourceTokenId(assets: SwapAsset[]) {
  if (!assets.length) return "";

  const stxAsset = assets.find((asset) => asset.tokenId === STX_TOKEN_ID);
  const firstOwnedAsset = assets.find((asset) => asset.hasBalance);

  return firstOwnedAsset?.tokenId ?? stxAsset?.tokenId ?? assets[0].tokenId;
}

export function getMinimumReceivedBaseUnits(
  contractCallParams: SwapContractCallParams | null | undefined,
  destinationToken: SwapToken | null | undefined,
) {
  if (!contractCallParams || !destinationToken) {
    return null;
  }

  if (destinationToken.tokenId === STX_TOKEN_ID) {
    const outputPostCondition = [...contractCallParams.postConditions]
      .reverse()
      .find(
        (
          postCondition,
        ): postCondition is Extract<
          SerializedPostCondition,
          { type: "stx-postcondition" }
        > =>
          postCondition.type === "stx-postcondition" &&
          postCondition.condition !== "eq",
      );

    return outputPostCondition?.amount ?? null;
  }

  if (!destinationToken.tokenContract) {
    return null;
  }

  const assetPrefix = `${destinationToken.tokenContract.toLowerCase()}::`;
  const outputPostCondition = [...contractCallParams.postConditions]
    .reverse()
    .find(
      (
        postCondition,
      ): postCondition is Extract<
        SerializedPostCondition,
        { type: "ft-postcondition" }
      > =>
        postCondition.type === "ft-postcondition" &&
        postCondition.asset.toLowerCase().startsWith(assetPrefix),
    );

  return outputPostCondition?.amount ?? null;
}
